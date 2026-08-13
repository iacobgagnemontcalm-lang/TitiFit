import { getPercentile } from '@/benchmarkEngine';
import { ATHLETE_TYPES, ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { OFFICIAL_TEST_IDS, TESTS } from '@/data/tests';
import { TIERS } from '@/data/tiers';
import type {
  AthleteTypeId,
  CardTier,
  CategoryId,
  CategoryRating,
  ComparisonSubject,
  OfficialTestId,
  OverallRating,
  PersonalRecord,
  TestRating,
} from '@/types';
import { clamp, mean, round } from '@/utils/math';

/**
 * The rating engine turns "best result per test" into the numbers the whole
 * app is built on. It is pure: same inputs → same outputs, no store access.
 */

export type BestResults = Partial<Record<OfficialTestId, PersonalRecord>>;

// ---------------------------------------------------------------------------
// Test → category → overall
// ---------------------------------------------------------------------------

export function calculateTestRating(
  testId: OfficialTestId,
  metricValue: number,
  subject: ComparisonSubject,
): { rating: number; percentile: number; isSimulated: boolean } | null {
  const result = getPercentile({
    testId,
    sex: subject.sex,
    age: subject.age,
    bodyWeightKg: subject.bodyWeightKg,
    value: metricValue,
  });
  if (!result) return null;
  return {
    rating: result.rating,
    percentile: result.percentile,
    isSimulated: result.isSimulated,
  };
}

function buildTestRatings(
  categoryId: CategoryId,
  best: BestResults,
): TestRating[] {
  return CATEGORIES[categoryId].officialTests.map((testId) => {
    const pr = best[testId];
    return {
      testId,
      rating: pr?.rating ?? null,
      percentile: pr?.percentile ?? null,
      metricValue: pr?.metricValue ?? null,
      isSimulatedBenchmark: true,
      date: pr?.date,
    } satisfies TestRating;
  });
}

/**
 * A category rating is the plain mean of its official test ratings.
 * Missing tests are *excluded* rather than counted as zero — an incomplete
 * profile is flagged (`isPartial`), never silently penalized.
 */
export function calculateCategoryRating(
  categoryId: CategoryId,
  best: BestResults,
): CategoryRating {
  const tests = buildTestRatings(categoryId, best);
  const done = tests.filter((t) => t.rating != null);

  return {
    categoryId,
    rating: done.length ? round(mean(done.map((t) => t.rating!)), 1) : null,
    percentile: done.length ? round(mean(done.map((t) => t.percentile!)), 1) : null,
    tests,
    completedTests: done.length,
    totalTests: tests.length,
    isPartial: done.length > 0 && done.length < tests.length,
  };
}

/** Force = (Deadlift + Squat + Bench) / 3 */
export const calculateStrengthRating = (best: BestResults) =>
  calculateCategoryRating('strength', best);

/** Bodyweight = (Pull-up + Push-up) / 2 */
export const calculateBodyweightRating = (best: BestResults) =>
  calculateCategoryRating('bodyweight', best);

export const calculateHybridRating = (best: BestResults) =>
  calculateCategoryRating('hybrid', best);

export const calculateSpeedRating = (best: BestResults) =>
  calculateCategoryRating('speed', best);

export const calculateEnduranceRating = (best: BestResults) =>
  calculateCategoryRating('endurance', best);

/**
 * Overall = Force×0.20 + Bodyweight×0.20 + Hybrid×0.20 + Speed×0.20 + Endurance×0.20
 *
 * When a category has no data at all, its 20% is redistributed over the
 * categories that do have data and the result is marked `isProvisional`.
 */
export function calculateOverallRating(best: BestResults): OverallRating {
  const categories = CATEGORY_ORDER.reduce(
    (acc, id) => ({ ...acc, [id]: calculateCategoryRating(id, best) }),
    {} as Record<CategoryId, CategoryRating>,
  );

  const rated = CATEGORY_ORDER.map((id) => categories[id]).filter((c) => c.rating != null);
  const completedTests = OFFICIAL_TEST_IDS.filter((id) => best[id] != null).length;
  const completeness = completedTests / OFFICIAL_TEST_IDS.length;

  if (rated.length === 0) {
    return {
      value: null,
      exact: null,
      percentile: null,
      categories,
      completeness: 0,
      isProvisional: true,
      tier: 'bronze',
      athleteType: 'unranked',
    };
  }

  const totalWeight = rated.reduce((s, c) => s + CATEGORIES[c.categoryId].weight, 0);
  const exact =
    rated.reduce((s, c) => s + c.rating! * CATEGORIES[c.categoryId].weight, 0) / totalWeight;

  const percentile = round(mean(rated.map((c) => c.percentile!)), 1);
  const value = Math.round(exact);

  return {
    value,
    exact: round(exact, 2),
    percentile,
    categories,
    completeness,
    isProvisional: rated.length < CATEGORY_ORDER.length,
    tier: calculateCardTier(value),
    athleteType: calculateAthleteType(categories, exact),
  };
}

// ---------------------------------------------------------------------------
// Card tier
// ---------------------------------------------------------------------------

export function calculateCardTier(overall: number | null): CardTier {
  if (overall == null) return 'bronze';
  const clamped = clamp(overall, 0, 99);
  return TIERS.find((t) => clamped >= t.min && clamped <= t.max)?.id ?? 'bronze';
}

/** Overall needed to reach the next rarity, or null at Legendary. */
export function nextTierThreshold(overall: number): { tier: CardTier; at: number } | null {
  const next = TIERS.find((t) => t.min > overall);
  return next ? { tier: next.id, at: next.min } : null;
}

// ---------------------------------------------------------------------------
// Athlete type
// ---------------------------------------------------------------------------

/** The specialist archetype that names each category, used as a fallback. */
const ARCHETYPE_BY_TOP_CATEGORY: Record<CategoryId, AthleteTypeId> = {
  strength: 'powerhouse',
  bodyweight: 'gymnast',
  hybrid: 'workhorse',
  speed: 'speedster',
  endurance: 'engine',
};

/** Categories an archetype is *about* — the ones carrying its top emphasis. */
function primaryCategories(emphasis: Partial<Record<CategoryId, number>>): CategoryId[] {
  const keys = Object.keys(emphasis) as CategoryId[];
  if (keys.length === 0) return [];
  const max = Math.max(...keys.map((k) => emphasis[k] ?? 0));
  if (max < 0.85) return [];
  return keys.filter((k) => (emphasis[k] ?? 0) >= max - 0.001);
}

/**
 * Matched on profile *shape*: each category's deviation from the athlete's own
 * mean is scored against the archetype's emphasis vector.
 *
 * Two gates keep the result legible:
 *  - spread gates separate specialists from balanced profiles;
 *  - an archetype's primary categories must actually be the athlete's top
 *    ones. Without this, negative emphasis terms let "weak at speed" outweigh
 *    "strongest at endurance", and the app would name a Powerhouse whose best
 *    category is running.
 */
export function calculateAthleteType(
  categories: Record<CategoryId, CategoryRating>,
  overall: number,
): AthleteTypeId {
  const rated = CATEGORY_ORDER.filter((id) => categories[id].rating != null);
  const values = rated.map((id) => categories[id].rating!);
  if (values.length === 0) return 'unranked';

  const ranked = [...rated].sort(
    (a, b) => (categories[b].rating ?? 0) - (categories[a].rating ?? 0),
  );
  const topCategory = ranked[0];

  // Fewer than three categories is not enough signal for a shape.
  if (values.length < 3) {
    return topCategory ? ARCHETYPE_BY_TOP_CATEGORY[topCategory] : 'unranked';
  }

  const avg = mean(values);
  const spread = Math.max(...values) - Math.min(...values);

  const deviations = CATEGORY_ORDER.reduce((acc, id) => {
    const rating = categories[id].rating;
    acc[id] = rating == null ? 0 : rating - avg;
    return acc;
  }, {} as Record<CategoryId, number>);

  let bestType: AthleteTypeId | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const type of ATHLETE_TYPES) {
    if (type.minOverall != null && overall < type.minOverall) continue;
    if (type.maxSpread != null && spread > type.maxSpread) continue;
    if (type.minSpread != null && spread < type.minSpread) continue;

    const primaries = primaryCategories(type.emphasis);
    const topSlice = ranked.slice(0, Math.max(1, primaries.length));
    if (primaries.some((id) => !topSlice.includes(id))) continue;

    const emphasisKeys = Object.keys(type.emphasis) as CategoryId[];
    // A balanced archetype has no emphasis vector. It is scored on how far
    // *inside* its own tightness ceiling the profile sits, so the archetype
    // with the stricter requirements (Hybrid Elite) outranks the looser one
    // (All-Rounder) whenever both qualify.
    const score = emphasisKeys.length
      ? emphasisKeys.reduce((s, id) => s + (type.emphasis[id] ?? 0) * deviations[id], 0) /
        Math.sqrt(emphasisKeys.length)
      : (type.maxSpread ?? 6) - spread;

    if (score > bestScore) {
      bestScore = score;
      bestType = type.id;
    }
  }

  if (bestType) return bestType;
  return topCategory ? ARCHETYPE_BY_TOP_CATEGORY[topCategory] : 'all_rounder';
}

export const athleteTypeInfo = (id: AthleteTypeId) => ATHLETE_TYPE_BY_ID[id];

// ---------------------------------------------------------------------------
// Helpers used across screens
// ---------------------------------------------------------------------------

/** Weakest category with data — the honest first place to spend effort. */
export function weakestCategory(
  categories: Record<CategoryId, CategoryRating>,
): CategoryId | null {
  const rated = CATEGORY_ORDER.filter((id) => categories[id].rating != null);
  if (!rated.length) return null;
  return rated.reduce((a, b) =>
    (categories[a].rating ?? 100) <= (categories[b].rating ?? 100) ? a : b,
  );
}

export function strongestCategory(
  categories: Record<CategoryId, CategoryRating>,
): CategoryId | null {
  const rated = CATEGORY_ORDER.filter((id) => categories[id].rating != null);
  if (!rated.length) return null;
  return rated.reduce((a, b) =>
    (categories[a].rating ?? 0) >= (categories[b].rating ?? 0) ? a : b,
  );
}

/** Overall impact of moving one test by `delta` rating points. */
export function overallImpactOfTest(testId: OfficialTestId, delta: number): number {
  const category = TESTS[testId].category;
  const testsInCategory = CATEGORIES[category].officialTests.length;
  return (delta / testsInCategory) * CATEGORIES[category].weight;
}
