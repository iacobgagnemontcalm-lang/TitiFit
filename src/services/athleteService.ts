import { OFFICIAL_TEST_IDS, TESTS, isOfficialTest } from '@/data/tests';
import type {
  AchievementProgress,
  BeerSettings,
  BeerSummary,
  ChallengeProgress,
  ComparisonSubject,
  JourneyPoint,
  LevelState,
  OfficialTestId,
  OverallRating,
  PersonalRecord,
  ProjectedRating,
  StreakConfig,
  StreakState,
  TestId,
  TestResult,
  UnlockedAchievement,
  User,
  XPTransaction,
} from '@/types';
import { ageFromBirthDate } from '@/utils/date';

import { evaluateAchievements, type AchievementContext } from './achievementEngine';
import { calculateBeerSummary } from './beerEngine';
import { activeChallenges } from './challengeEngine';
import { buildJourney, careerStats, projectRating, type CareerStats } from './progressionEngine';
import { calculateOverallRating, calculateTestRating, type BestResults } from './ratingEngine';
import { calculateStreak } from './streakEngine';
import { levelFromTotalXP } from './xpEngine';

export const subjectFromUser = (user: User): ComparisonSubject => ({
  sex: user.sex,
  age: ageFromBirthDate(user.birthDate),
  bodyWeightKg: user.bodyWeightKg,
  heightCm: user.heightCm,
});

/** Direction-aware "is this result better than the current best". */
export function isImprovement(testId: TestId, candidate: number, incumbent: number): boolean {
  return TESTS[testId].direction === 'lower_is_better'
    ? candidate < incumbent
    : candidate > incumbent;
}

/**
 * Best result per test, scored against the athlete's current comparison group.
 * Includes secondary tests so the history and achievement screens can use them,
 * but only official ids reach the rating engine.
 */
export function computeBests(
  results: TestResult[],
  subject: ComparisonSubject,
): Partial<Record<TestId, PersonalRecord>> {
  const bests: Partial<Record<TestId, PersonalRecord>> = {};

  for (const result of results) {
    const current = bests[result.testId];
    if (current && !isImprovement(result.testId, result.metricValue, current.metricValue)) {
      continue;
    }

    const scored = isOfficialTest(result.testId)
      ? calculateTestRating(result.testId, result.metricValue, subject)
      : null;

    bests[result.testId] = {
      testId: result.testId,
      resultId: result.id,
      metricValue: result.metricValue,
      percentile: scored?.percentile ?? 0,
      rating: scored?.rating ?? 0,
      date: result.date,
    };
  }

  return bests;
}

export const officialBests = (
  bests: Partial<Record<TestId, PersonalRecord>>,
): BestResults =>
  OFFICIAL_TEST_IDS.reduce((acc, id) => {
    const pr = bests[id];
    if (pr) acc[id as OfficialTestId] = pr;
    return acc;
  }, {} as BestResults);

/** Everything the UI needs, derived from raw state in one pass. */
export interface AthleteState {
  subject: ComparisonSubject;
  bests: Partial<Record<TestId, PersonalRecord>>;
  officialBests: BestResults;
  overall: OverallRating;
  level: LevelState;
  streak: StreakState;
  beer: BeerSummary;
  achievements: AchievementProgress[];
  challenges: ChallengeProgress[];
  journey: JourneyPoint[];
  projection: ProjectedRating | null;
  career: CareerStats;
  completedTests: number;
  totalTests: number;
}

export interface ComputeAthleteStateInput {
  user: User;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  unlockedAchievements: UnlockedAchievement[];
  beerSettings: BeerSettings;
  streakConfig: StreakConfig;
  today?: string;
}

export function computeAthleteState(input: ComputeAthleteStateInput): AthleteState {
  const subject = subjectFromUser(input.user);
  const bests = computeBests(input.results, subject);
  const official = officialBests(bests);
  const overall = calculateOverallRating(official);

  const totalXP = input.xpTransactions.reduce((s, t) => s + t.amount, 0);
  const level = levelFromTotalXP(totalXP);
  const streak = calculateStreak(input.results, input.streakConfig, input.today);
  const beer = calculateBeerSummary(input.results, input.beerSettings, input.today);

  const achievementContext: AchievementContext = {
    bests,
    categories: overall.categories,
    overall: overall.value,
    streakWeeks: streak.current,
    totalResults: input.results.length,
    beersAllTime: beer.allTime,
    bodyWeightKg: input.user.bodyWeightKg,
  };

  const journey = buildJourney(input.results, subject);
  const prCount = countPRs(input.results);

  return {
    subject,
    bests,
    officialBests: official,
    overall,
    level,
    streak,
    beer,
    achievements: evaluateAchievements(achievementContext, input.unlockedAchievements),
    challenges: activeChallenges(input.results, input.today),
    journey,
    projection: projectRating(journey, 12, overall.value ?? undefined),
    career: careerStats(input.results, journey, prCount),
    completedTests: OFFICIAL_TEST_IDS.filter((id) => official[id] != null).length,
    totalTests: OFFICIAL_TEST_IDS.length,
  };
}

/** Number of results that were a personal record when they were logged. */
export function countPRs(results: TestResult[]): number {
  const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
  const best = new Map<TestId, number>();
  let count = 0;

  for (const result of sorted) {
    const incumbent = best.get(result.testId);
    if (incumbent == null || isImprovement(result.testId, result.metricValue, incumbent)) {
      best.set(result.testId, result.metricValue);
      count += 1;
    }
  }
  return count;
}
