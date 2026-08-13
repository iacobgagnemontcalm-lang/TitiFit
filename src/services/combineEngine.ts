import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS } from '@/data/tests';
import type {
  AthleteSummary,
  CategoryId,
  Combine,
  CombineStanding,
  OfficialTestId,
} from '@/types';
import { mean, round } from '@/utils/math';

/**
 * COMBINE — a friendly meet between a handful of athletes.
 *
 * Scoring is rating-based rather than raw-performance based, so a 60 kg and a
 * 100 kg athlete can actually compete: each test is worth its rating (0–100),
 * and the general standing is the mean across the selected tests. Ranking by
 * raw kilos would just re-rank people by body weight.
 */

export interface CombineEntry {
  athlete: AthleteSummary;
  /** Rating per test, as achieved during the combine. */
  ratings: Partial<Record<OfficialTestId, number>>;
}

export interface CombineAward {
  id: string;
  label: string;
  userId: string;
  detail: string;
  icon: string;
}

export interface CombineResults {
  standings: CombineStanding[];
  awards: CombineAward[];
  perTest: { testId: OfficialTestId; ranking: { userId: string; rating: number }[] }[];
  perCategory: { categoryId: CategoryId; ranking: { userId: string; rating: number }[] }[];
}

export function computeCombine(combine: Combine, entries: CombineEntry[]): CombineResults {
  const testIds = combine.testIds;

  const scoreOf = (entry: CombineEntry) => {
    const values = testIds
      .map((id) => entry.ratings[id])
      .filter((v): v is number => v != null);
    return values.length ? round(mean(values), 1) : 0;
  };

  // --- General standing ----------------------------------------------------
  const ranked = [...entries].sort((a, b) => scoreOf(b) - scoreOf(a));

  // --- Per-test rankings ---------------------------------------------------
  const perTest = testIds.map((testId) => ({
    testId,
    ranking: entries
      .filter((e) => e.ratings[testId] != null)
      .map((e) => ({ userId: e.athlete.userId, rating: e.ratings[testId]! }))
      .sort((a, b) => b.rating - a.rating),
  }));

  const perTestRankOf = (userId: string) =>
    perTest.reduce(
      (acc, t) => {
        const index = t.ranking.findIndex((r) => r.userId === userId);
        if (index >= 0) acc[t.testId] = index + 1;
        return acc;
      },
      {} as Partial<Record<OfficialTestId, number>>,
    );

  // --- Per-category rankings ------------------------------------------------
  const categoriesInPlay = CATEGORY_ORDER.filter((categoryId) =>
    CATEGORIES[categoryId].officialTests.some((t) => testIds.includes(t)),
  );

  const categoryScore = (entry: CombineEntry, categoryId: CategoryId) => {
    const values = CATEGORIES[categoryId].officialTests
      .filter((t) => testIds.includes(t))
      .map((t) => entry.ratings[t])
      .filter((v): v is number => v != null);
    return values.length ? round(mean(values), 1) : null;
  };

  const perCategory = categoriesInPlay.map((categoryId) => ({
    categoryId,
    ranking: entries
      .map((e) => ({ userId: e.athlete.userId, rating: categoryScore(e, categoryId) }))
      .filter((r): r is { userId: string; rating: number } => r.rating != null)
      .sort((a, b) => b.rating - a.rating),
  }));

  // --- Awards ---------------------------------------------------------------
  const awards: CombineAward[] = [];
  const nameOf = (userId: string) =>
    entries.find((e) => e.athlete.userId === userId)?.athlete.displayName ?? '—';

  const mvp = ranked[0];
  if (mvp) {
    awards.push({
      id: 'mvp',
      label: 'MVP',
      userId: mvp.athlete.userId,
      detail: `${scoreOf(mvp).toFixed(1)} de moyenne sur ${testIds.length} tests`,
      icon: 'trophy',
    });
  }

  for (const { categoryId, ranking } of perCategory) {
    const top = ranking[0];
    if (!top) continue;
    awards.push({
      id: `best_${categoryId}`,
      label: `Meilleur ${CATEGORIES[categoryId].name}`,
      userId: top.userId,
      detail: `${nameOf(top.userId)} · ${top.rating.toFixed(1)}`,
      icon: CATEGORIES[categoryId].icon,
    });
  }

  // "Most complete" = the tightest spread, i.e. no weak spot on the day.
  const spreadOf = (entry: CombineEntry) => {
    const values = testIds.map((id) => entry.ratings[id]).filter((v): v is number => v != null);
    return values.length > 1 ? Math.max(...values) - Math.min(...values) : Number.POSITIVE_INFINITY;
  };
  const mostComplete = [...entries]
    .filter((e) => Number.isFinite(spreadOf(e)))
    .sort((a, b) => spreadOf(a) - spreadOf(b))[0];
  if (mostComplete) {
    awards.push({
      id: 'most_complete',
      label: 'Plus complet',
      userId: mostComplete.athlete.userId,
      detail: `${spreadOf(mostComplete).toFixed(0)} points d’écart entre son meilleur et son pire test`,
      icon: 'apps',
    });
  }

  const standings: CombineStanding[] = ranked.map((entry, index) => ({
    userId: entry.athlete.userId,
    username: entry.athlete.username,
    points: scoreOf(entry),
    rank: index + 1,
    perTestRank: perTestRankOf(entry.athlete.userId),
    awards: awards.filter((a) => a.userId === entry.athlete.userId).map((a) => a.label),
  }));

  return { standings, awards, perTest, perCategory };
}

/**
 * Builds combine entries from athletes' existing ratings. A real combine would
 * capture fresh results on the day; this is the "use what we know" fallback
 * that makes the screen useful before that flow exists.
 */
export function entriesFromSummaries(
  athletes: AthleteSummary[],
  testIds: OfficialTestId[],
): CombineEntry[] {
  return athletes.map((athlete) => ({
    athlete,
    ratings: testIds.reduce(
      (acc, testId) => {
        const categoryRating = athlete.categories[TESTS[testId].category];
        if (categoryRating != null) acc[testId] = categoryRating;
        return acc;
      },
      {} as Partial<Record<OfficialTestId, number>>,
    ),
  }));
}
