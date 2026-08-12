import { OFFICIAL_TEST_IDS, TESTS, isOfficialTest } from '@/data/tests';
import type {
  Achievement,
  AthleteTypeId,
  BeerSettings,
  CardTier,
  OfficialTestId,
  RPE,
  RawEntry,
  StreakConfig,
  TestId,
  TestResult,
  UnlockedAchievement,
  User,
  XPTransaction,
} from '@/types';
import { createId } from '@/utils/id';
import { todayISO } from '@/utils/date';
import { round } from '@/utils/math';

import { computeAthleteState, isImprovement } from './athleteService';
import { findNewlyUnlocked, type AchievementContext } from './achievementEngine';
import { calculateBeerSummary, estimateCalories } from './beerEngine';
import { calculateTestRating } from './ratingEngine';
import { estimateOneRepMax } from './repMax';
import { calculateStreak } from './streakEngine';
import { calculateXPReward, createXPTransaction, XP_REWARDS } from './xpEngine';

/**
 * The ADD RESULT pipeline, in the exact order the spec asks for:
 * compute → PR → percentile → test rating → category → Overall → XP →
 * achievements → athlete type → rarity → summary.
 *
 * Kept pure so the store just applies the returned patch and the summary screen
 * just renders the returned outcome.
 */

export interface AddResultInput {
  testId: TestId;
  date?: string;
  raw: RawEntry;
  rpe?: RPE;
  notes?: string;
  photoUri?: string;
  videoUri?: string;
  calories?: number;
  /** Overrides the profile weight when the athlete weighed in that day. */
  bodyWeightKg?: number;
}

export interface AddResultOutcome {
  result: TestResult;
  rating: number | null;
  percentile: number | null;
  previousRating: number | null;
  percentileDelta: number;
  isPR: boolean;
  isFirstTimeTest: boolean;
  xp: { total: number; lines: { label: string; amount: number }[] };
  xpTransactions: XPTransaction[];
  newAchievements: Achievement[];
  overallBefore: number | null;
  overallAfter: number | null;
  categoryBefore: number | null;
  categoryAfter: number | null;
  tierBefore: CardTier;
  tierAfter: CardTier;
  tierUpgraded: boolean;
  athleteTypeBefore: AthleteTypeId;
  athleteTypeAfter: AthleteTypeId;
  athleteTypeChanged: boolean;
  beersEarned: number;
  isSimulatedBenchmark: boolean;
}

/** Turns the user's raw input into the single canonical metric value. */
export function toMetricValue(
  testId: TestId,
  raw: RawEntry,
): { value: number; estimated: boolean } {
  const test = TESTS[testId];

  if (test.inputKind === 'weight_reps') {
    const weight = raw.weightKg ?? 0;
    const reps = raw.reps ?? 1;
    const oneRM = estimateOneRepMax(weight, reps);
    return { value: oneRM.value, estimated: oneRM.estimated };
  }
  if (test.inputKind === 'reps') return { value: raw.count ?? 0, estimated: false };
  if (test.inputKind === 'duration') return { value: raw.seconds ?? 0, estimated: false };
  return { value: raw.points ?? 0, estimated: false };
}

export interface AddResultContext {
  user: User;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  unlockedAchievements: UnlockedAchievement[];
  beerSettings: BeerSettings;
  streakConfig: StreakConfig;
}

export function processAddResult(
  input: AddResultInput,
  ctx: AddResultContext,
): AddResultOutcome {
  const date = input.date ?? todayISO();
  const bodyWeightKg = input.bodyWeightKg ?? ctx.user.bodyWeightKg;
  const { value, estimated } = toMetricValue(input.testId, input.raw);

  const result: TestResult = {
    id: createId('res'),
    testId: input.testId,
    date,
    raw: input.raw,
    metricValue: round(value, 2),
    estimated,
    bodyWeightKg,
    rpe: input.rpe,
    notes: input.notes,
    photoUri: input.photoUri,
    videoUri: input.videoUri,
    calories: input.calories,
    createdAt: new Date().toISOString(),
  };

  // --- State before -------------------------------------------------------
  const before = computeAthleteState({
    user: ctx.user,
    results: ctx.results,
    xpTransactions: ctx.xpTransactions,
    unlockedAchievements: ctx.unlockedAchievements,
    beerSettings: ctx.beerSettings,
    streakConfig: ctx.streakConfig,
    today: date,
  });

  const previousBest = before.bests[input.testId];
  const isFirstTimeTest = previousBest == null;
  const isPR =
    isFirstTimeTest || isImprovement(input.testId, result.metricValue, previousBest.metricValue);

  // --- State after --------------------------------------------------------
  const nextResults = [...ctx.results, result];
  const after = computeAthleteState({
    user: ctx.user,
    results: nextResults,
    xpTransactions: ctx.xpTransactions,
    unlockedAchievements: ctx.unlockedAchievements,
    beerSettings: ctx.beerSettings,
    streakConfig: ctx.streakConfig,
    today: date,
  });

  const scored = isOfficialTest(input.testId)
    ? calculateTestRating(input.testId as OfficialTestId, result.metricValue, {
        ...before.subject,
        bodyWeightKg,
      })
    : null;

  const percentileDelta =
    scored && previousBest ? round(scored.percentile - previousBest.percentile, 1) : 0;

  const categoryId = TESTS[input.testId].category;
  const categoryBefore = before.overall.categories[categoryId].rating;
  const categoryAfter = after.overall.categories[categoryId].rating;

  // --- XP -----------------------------------------------------------------
  const completesAllTests =
    after.completedTests === OFFICIAL_TEST_IDS.length &&
    before.completedTests < OFFICIAL_TEST_IDS.length;

  const xp = calculateXPReward({
    isPR,
    isFirstTimeTest: isFirstTimeTest && isOfficialTest(input.testId),
    percentileDelta: Math.max(0, percentileDelta),
    completesAllTests,
  });

  const xpTransactions = xp.lines.map((line) =>
    createXPTransaction(line.amount, line.reason, line.label, date, result.id),
  );

  // --- Achievements -------------------------------------------------------
  const beerAfter = calculateBeerSummary(nextResults, ctx.beerSettings, date);
  const achievementContext: AchievementContext = {
    bests: after.bests,
    categories: after.overall.categories,
    overall: after.overall.value,
    streakWeeks: calculateStreak(nextResults, ctx.streakConfig, date).current,
    totalResults: nextResults.length,
    beersAllTime: beerAfter.allTime,
    bodyWeightKg,
  };
  const newAchievements = findNewlyUnlocked(achievementContext, ctx.unlockedAchievements);

  for (const achievement of newAchievements) {
    xpTransactions.push(
      createXPTransaction(
        achievement.xp,
        'achievement_unlocked',
        achievement.name,
        date,
        achievement.id,
      ),
    );
  }

  // --- Rarity -------------------------------------------------------------
  const tierUpgraded = before.overall.tier !== after.overall.tier;
  if (tierUpgraded) {
    xpTransactions.push(
      createXPTransaction(
        XP_REWARDS.tier_upgrade,
        'tier_upgrade',
        `Carte ${after.overall.tier}`,
        date,
      ),
    );
  }

  const totalXP = xpTransactions.reduce((s, t) => s + t.amount, 0);

  return {
    result,
    rating: scored?.rating ?? null,
    percentile: scored?.percentile ?? null,
    previousRating: previousBest?.rating ?? null,
    percentileDelta,
    isPR,
    isFirstTimeTest,
    xp: {
      total: totalXP,
      lines: xpTransactions.map((t) => ({ label: t.label, amount: t.amount })),
    },
    xpTransactions,
    newAchievements,
    overallBefore: before.overall.value,
    overallAfter: after.overall.value,
    categoryBefore,
    categoryAfter,
    tierBefore: before.overall.tier,
    tierAfter: after.overall.tier,
    tierUpgraded,
    athleteTypeBefore: before.overall.athleteType,
    athleteTypeAfter: after.overall.athleteType,
    athleteTypeChanged: before.overall.athleteType !== after.overall.athleteType,
    beersEarned: round(estimateCalories(result) / ctx.beerSettings.referenceKcal, 1),
    isSimulatedBenchmark: scored?.isSimulated ?? true,
  };
}

export function unlockedFromAchievements(
  achievements: Achievement[],
  date: string,
): UnlockedAchievement[] {
  return achievements.map((a) => ({ achievementId: a.id, date }));
}
