import { OFFICIAL_TEST_IDS, TESTS } from '@/data/tests';
import type {
  ComparisonSubject,
  JourneyPoint,
  OfficialTestId,
  PersonalRecord,
  ProjectedRating,
  TestResult,
} from '@/types';
import { monthKey } from '@/utils/date';
import { clamp, round } from '@/utils/math';

import { calculateCardTier, calculateOverallRating, calculateTestRating, type BestResults } from './ratingEngine';

/**
 * Rebuilds the athlete's Overall as it was at the end of every month that has
 * data — the backbone of the Athlete Journey screen and of the projection.
 */
export function buildJourney(
  results: TestResult[],
  subject: ComparisonSubject,
): JourneyPoint[] {
  if (results.length === 0) return [];

  const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(sorted.map((r) => monthKey(r.date)))].sort();

  const bests: BestResults = {};
  const points: JourneyPoint[] = [];
  let cursor = 0;

  for (const month of months) {
    while (cursor < sorted.length && monthKey(sorted[cursor]!.date) <= month) {
      const result = sorted[cursor]!;
      cursor += 1;
      if (!OFFICIAL_TEST_IDS.includes(result.testId as OfficialTestId)) continue;

      const testId = result.testId as OfficialTestId;
      const scored = calculateTestRating(testId, result.metricValue, {
        ...subject,
        bodyWeightKg: result.bodyWeightKg,
      });
      if (!scored) continue;

      const previous = bests[testId];
      const better =
        !previous ||
        (TESTS[testId].direction === 'lower_is_better'
          ? result.metricValue < previous.metricValue
          : result.metricValue > previous.metricValue);

      if (better) {
        bests[testId] = {
          testId,
          resultId: result.id,
          metricValue: result.metricValue,
          percentile: scored.percentile,
          rating: scored.rating,
          date: result.date,
        } satisfies PersonalRecord;
      }
    }

    const overall = calculateOverallRating(bests);
    if (overall.value != null) {
      points.push({ month, overall: overall.value, tier: calculateCardTier(overall.value) });
    }
  }

  return points;
}

/**
 * PROJECTED RATING — a linear extrapolation of the recent trend.
 * Explicitly a projection, never a promise: confidence drops with thin history,
 * and the growth rate is damped because progress slows as ratings climb.
 */
export function projectRating(
  journey: JourneyPoint[],
  weeks = 12,
  currentOverall?: number,
): ProjectedRating | null {
  const current = currentOverall ?? journey[journey.length - 1]?.overall;
  if (current == null) return null;

  if (journey.length < 2) {
    return { current, projected: current, weeks, weeklyRate: 0, confidence: 'low' };
  }

  // Use up to the last 6 months of history.
  const window = journey.slice(-6);
  const first = window[0]!;
  const last = window[window.length - 1]!;
  const monthsElapsed = Math.max(1, window.length - 1);
  const weeklyRate = (last.overall - first.overall) / (monthsElapsed * 4.345);

  // Two brakes, because a naive extrapolation of an early-athlete curve
  // promises numbers nobody hits:
  //  1. the closer to 99, the harder each point is;
  //  2. a hard cap at 20% of the remaining headroom over the whole window.
  const headroom = clamp((99 - current) / 40, 0.15, 1);
  const damped = weeklyRate * headroom;
  const maxGain = (99 - current) * 0.2;
  const gain = clamp(damped * weeks, -maxGain, maxGain);

  const projected = clamp(round(current + gain, 0), 0, 99);
  const confidence: ProjectedRating['confidence'] =
    window.length >= 4 ? 'high' : window.length === 3 ? 'medium' : 'low';

  return { current, projected, weeks, weeklyRate: round(damped, 3), confidence };
}

export interface CareerStats {
  totalResults: number;
  totalPRs: number;
  bestOverall: number | null;
  firstOverall: number | null;
  overallGain: number | null;
  activeDays: number;
}

export function careerStats(
  results: TestResult[],
  journey: JourneyPoint[],
  prCount: number,
): CareerStats {
  const overalls = journey.map((j) => j.overall);
  const first = overalls[0] ?? null;
  const best = overalls.length ? Math.max(...overalls) : null;
  const latest = overalls[overalls.length - 1] ?? null;

  return {
    totalResults: results.length,
    totalPRs: prCount,
    bestOverall: best,
    firstOverall: first,
    overallGain: first != null && latest != null ? latest - first : null,
    activeDays: new Set(results.map((r) => r.date)).size,
  };
}
