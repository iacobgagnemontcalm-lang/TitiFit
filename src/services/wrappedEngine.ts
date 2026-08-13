import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS, isOfficialTest } from '@/data/tests';
import type {
  AthleteTypeId,
  CategoryId,
  ComparisonSubject,
  OfficialTestId,
  TestId,
  TestResult,
  XPTransaction,
} from '@/types';
import { monthKey } from '@/utils/date';

import { computeAthleteState, countPRs, type AthleteState } from './athleteService';
import { calculateOverallRating, calculateTestRating } from './ratingEngine';
import type { AppSettings } from '@/store/settings';
import type { User } from '@/types';

/**
 * ATHLETE WRAPPED — the year in review.
 *
 * Built by replaying the year twice: the profile as it stood on Jan 1st, and
 * the profile as it stands now. Everything else is a diff between the two, so
 * the numbers are the same ones the rest of the app shows.
 */

export interface WrappedStat {
  label: string;
  value: string;
  detail?: string;
  icon: string;
  accent: string;
}

export interface AthleteWrapped {
  year: number;
  hasData: boolean;
  workouts: number;
  personalRecords: number;
  activeDays: number;
  totalXP: number;
  beers: number;
  overallStart: number | null;
  overallEnd: number | null;
  overallGain: number | null;
  bestCategory: CategoryId | null;
  mostImprovedCategory: CategoryId | null;
  mostImprovedGain: number | null;
  bestLift?: { testId: TestId; label: string };
  bestRun?: { testId: TestId; label: string };
  /** True when there is no earlier year to compare against. */
  isFirstYear: boolean;
  athleteTypeStart: AthleteTypeId | null;
  athleteTypeEnd: AthleteTypeId;
  longestStreak: number;
  favouriteMonth: string | null;
}

export interface WrappedInput {
  user: User;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  settings: AppSettings;
  state: AthleteState;
  year: number;
}

/** Ratings the athlete held using only results logged before `year`. */
function ratingsBefore(
  results: TestResult[],
  year: number,
  subject: ComparisonSubject,
  input: WrappedInput,
) {
  const priorResults = results.filter((r) => Number(r.date.slice(0, 4)) < year);
  if (priorResults.length === 0) return null;

  const prior = computeAthleteState({
    user: input.user,
    results: priorResults,
    xpTransactions: [],
    unlockedAchievements: [],
    beerSettings: input.settings.beer,
    streakConfig: input.settings.streak,
    today: `${year - 1}-12-31`,
  });
  void subject;
  return prior;
}

export function buildWrapped(input: WrappedInput): AthleteWrapped {
  const { user, results, xpTransactions, state, year } = input;

  const inYear = results.filter((r) => r.date.startsWith(`${year}`));
  const before = ratingsBefore(results, year, state.subject, input);

  const startOverall = before?.overall.value ?? null;
  const endOverall = state.overall.value;

  // --- Most improved category --------------------------------------------
  // Only meaningful when there IS a previous year to compare against. Without
  // one, the "gain" would just be the current rating, which reads as a wild
  // improvement the athlete never made.
  const isFirstYear = before == null;
  let mostImproved: CategoryId | null = null;
  let mostImprovedGain: number | null = null;

  if (!isFirstYear) {
    for (const id of CATEGORY_ORDER) {
      const now = state.overall.categories[id].rating;
      const then = before!.overall.categories[id].rating;
      if (now == null || then == null) continue;
      const gain = Math.round((now - then) * 10) / 10;
      if (mostImprovedGain == null || gain > mostImprovedGain) {
        mostImprovedGain = gain;
        mostImproved = id;
      }
    }
  }

  const bestCategory = CATEGORY_ORDER.filter(
    (id) => state.overall.categories[id].rating != null,
  ).sort(
    (a, b) => (state.overall.categories[b].rating ?? 0) - (state.overall.categories[a].rating ?? 0),
  )[0];

  // --- Signature performances of the year ---------------------------------
  // Ranked by *rating*, not by raw value: on raw seconds a 400 m always beats
  // a 5 km, and on raw kilos a deadlift always beats a bench. Rating is the
  // only scale on which different tests are comparable.
  const bestOf = (predicate: (id: TestId) => boolean) => {
    const candidates = inYear
      .filter((r) => predicate(r.testId) && isOfficialTest(r.testId))
      .map((r) => ({
        result: r,
        rating:
          calculateTestRating(r.testId as OfficialTestId, r.metricValue, {
            ...state.subject,
            bodyWeightKg: r.bodyWeightKg,
          })?.rating ?? 0,
      }));
    if (candidates.length === 0) return undefined;
    return candidates.reduce((acc, c) => (c.rating > acc.rating ? c : acc)).result;
  };

  const liftResult = bestOf((id) => TESTS[id].unit === 'kg');
  const runResult = bestOf((id) => TESTS[id].unit === 'seconds' && TESTS[id].category !== 'hybrid');

  // --- Busiest month --------------------------------------------------------
  const perMonth = new Map<string, number>();
  for (const r of inYear) perMonth.set(monthKey(r.date), (perMonth.get(monthKey(r.date)) ?? 0) + 1);
  const favouriteMonth = [...perMonth.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const xpInYear = xpTransactions
    .filter((t) => t.date.startsWith(`${year}`))
    .reduce((s, t) => s + t.amount, 0);

  return {
    year,
    hasData: inYear.length > 0,
    workouts: inYear.length,
    personalRecords: countPRs(inYear),
    activeDays: new Set(inYear.map((r) => r.date)).size,
    totalXP: xpInYear,
    beers: state.beer.allTime,
    overallStart: startOverall,
    overallEnd: endOverall,
    overallGain: startOverall != null && endOverall != null ? endOverall - startOverall : null,
    isFirstYear,
    bestCategory: bestCategory ?? null,
    mostImprovedCategory: mostImproved,
    mostImprovedGain,
    bestLift: liftResult
      ? { testId: liftResult.testId, label: `${Math.round(liftResult.metricValue)} kg` }
      : undefined,
    bestRun: runResult
      ? {
          testId: runResult.testId,
          label: `${Math.floor(runResult.metricValue / 60)}:${Math.round(runResult.metricValue % 60)
            .toString()
            .padStart(2, '0')}`,
        }
      : undefined,
    athleteTypeStart: before?.overall.athleteType ?? null,
    athleteTypeEnd: state.overall.athleteType,
    longestStreak: state.streak.longest,
    favouriteMonth,
  };
}

/** Text summary for the share sheet. */
export function wrappedShareText(wrapped: AthleteWrapped, displayName: string): string {
  const lines = [
    `${displayName} — TitiFit Wrapped ${wrapped.year}`,
    `${wrapped.workouts} entraînements · ${wrapped.personalRecords} records personnels`,
    wrapped.overallGain != null
      ? `Overall ${wrapped.overallStart} → ${wrapped.overallEnd} (${wrapped.overallGain >= 0 ? '+' : ''}${wrapped.overallGain})`
      : `Overall ${wrapped.overallEnd ?? '—'}`,
    wrapped.mostImprovedCategory
      ? `Plus grosse progression : ${CATEGORIES[wrapped.mostImprovedCategory].name}`
      : null,
    `${wrapped.totalXP} XP · série record de ${wrapped.longestStreak} semaines`,
    'Découvre quel athlète tu es.',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Re-exported for callers that need a bare rating snapshot. */
export { calculateOverallRating };
