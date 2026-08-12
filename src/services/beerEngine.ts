import { TESTS, TEST_DISTANCE_METRES } from '@/data/tests';
import type { BeerSettings, BeerSummary, TestResult } from '@/types';
import { monthKey, todayISO, weekKey } from '@/utils/date';
import { round } from '@/utils/math';

/**
 * BEER EARNED 🍺 — a joke metric, not a drinking recommendation.
 * It converts the estimated energy cost of a session into "reference beers".
 * The whole feature can be switched off in settings (`BeerSettings.enabled`).
 */

export const DEFAULT_BEER_SETTINGS: BeerSettings = {
  enabled: true,
  /** 12 oz / 355 ml regular lager ≈ 165 kcal. */
  referenceKcal: 165,
};

/** MET values per test, used when the user does not supply calories. */
const TEST_MET: Record<string, number> = {
  deadlift: 6,
  back_squat: 6,
  bench_press: 5,
  overhead_press: 5,
  front_squat: 6,
  pull_ups: 8,
  push_ups_60s: 8,
  dips: 8,
  plank_hold: 4,
  hybrid_gauntlet: 12,
  run_100m: 14,
  run_300m: 13,
  run_400m: 13,
  run_1600m: 11.5,
  run_5k: 11,
  run_10k: 10.5,
};

/** Assumed working duration in seconds for tests that are not themselves timed. */
const ASSUMED_SESSION_SECONDS: Record<string, number> = {
  deadlift: 1800,
  back_squat: 1800,
  bench_press: 1800,
  overhead_press: 1500,
  front_squat: 1500,
  pull_ups: 600,
  push_ups_60s: 600,
  dips: 600,
  plank_hold: 300,
};

/**
 * kcal ≈ MET × 3.5 × kg / 200 × minutes. Deliberately rough — it feeds a joke
 * counter, and any Apple Health / Garmin integration should override it by
 * setting `TestResult.calories` directly.
 */
export function estimateCalories(result: TestResult): number {
  if (result.calories != null && result.calories > 0) return result.calories;

  const test = TESTS[result.testId];
  const met = TEST_MET[result.testId] ?? 6;
  const seconds =
    test.unit === 'seconds' && result.metricValue > 0
      ? result.metricValue
      : (ASSUMED_SESSION_SECONDS[result.testId] ?? 900);

  const minutes = seconds / 60;
  return Math.round((met * 3.5 * result.bodyWeightKg) / 200 * minutes);
}

export const beersFromKcal = (kcal: number, settings: BeerSettings) =>
  kcal / Math.max(1, settings.referenceKcal);

export function calculateBeerSummary(
  results: TestResult[],
  settings: BeerSettings = DEFAULT_BEER_SETTINGS,
  today: string = todayISO(),
): BeerSummary {
  const currentWeek = weekKey(today);
  const currentMonth = monthKey(today);

  let todayKcal = 0;
  let weekKcal = 0;
  let monthKcal = 0;
  let allTimeKcal = 0;

  for (const r of results) {
    const kcal = estimateCalories(r);
    allTimeKcal += kcal;
    if (r.date === today) todayKcal += kcal;
    if (weekKey(r.date) === currentWeek) weekKcal += kcal;
    if (monthKey(r.date) === currentMonth) monthKcal += kcal;
  }

  return {
    today: round(beersFromKcal(todayKcal, settings), 1),
    week: round(beersFromKcal(weekKcal, settings), 1),
    month: round(beersFromKcal(monthKcal, settings), 1),
    allTime: Math.round(beersFromKcal(allTimeKcal, settings)),
    kcalAllTime: allTimeKcal,
  };
}

/** Distance covered, in metres — used by challenges and the journey screen. */
export function totalDistanceMetres(results: TestResult[]): number {
  return results.reduce((s, r) => s + (TEST_DISTANCE_METRES[r.testId] ?? 0), 0);
}
