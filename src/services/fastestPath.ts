import { getValueForRating } from '@/benchmarkEngine';
import { OFFICIAL_TEST_IDS, TESTS } from '@/data/tests';
import type {
  ComparisonSubject,
  FastestPathPlan,
  FastestPathStep,
  OfficialTestId,
  PersonalRecord,
  UnitPreferences,
} from '@/types';
import { formatMetric } from '@/utils/format';
import { clamp, mean, round } from '@/utils/math';

import { calculateOverallRating, type BestResults } from './ratingEngine';

/**
 * FASTEST PATH TO <next Overall>
 *
 * For every official test we ask: "if this one number moved by a realistic
 * step, how much Overall would it buy?" The answer is computed by actually
 * re-running the rating engine on a mutated copy of the athlete's bests — so
 * it stays correct even when the Overall is provisional and weights are
 * renormalized.
 */

/** Default rating step probed per test. Small enough to be believable. */
const DEFAULT_STEP = 3;

export interface FastestPathOptions {
  step?: number;
  goalOverall?: number;
  units: UnitPreferences;
}

function cloneBests(bests: BestResults): BestResults {
  return { ...bests };
}

function simulate(
  bests: BestResults,
  testId: OfficialTestId,
  rating: number,
  metricValue: number,
): BestResults {
  const next = cloneBests(bests);
  const previous = bests[testId];
  next[testId] = {
    testId,
    resultId: previous?.resultId ?? 'simulated',
    metricValue,
    percentile: rating,
    rating,
    date: previous?.date ?? new Date().toISOString().slice(0, 10),
  } satisfies PersonalRecord;
  return next;
}

/**
 * How reachable a step is: smaller jumps are easier, and low ratings improve
 * faster than high ones (the top of the curve is dense).
 */
function reachabilityOf(currentRating: number, targetRating: number): number {
  const jump = targetRating - currentRating;
  const jumpFactor = clamp(1 - jump / 15, 0.05, 1);
  const headroomFactor = 0.45 + 0.55 * clamp((100 - currentRating) / 100, 0, 1);
  return round(clamp(jumpFactor * headroomFactor, 0.05, 1), 2);
}

export function calculateFastestPath(
  bests: BestResults,
  subject: ComparisonSubject,
  options: FastestPathOptions,
): FastestPathPlan {
  const step = options.step ?? DEFAULT_STEP;
  const current = calculateOverallRating(bests);
  const currentExact = current.exact ?? 0;
  const goal = options.goalOverall ?? Math.floor(currentExact) + 1;

  const knownRatings = OFFICIAL_TEST_IDS.map((id) => bests[id]?.rating).filter(
    (r): r is number => r != null,
  );
  const baselineForNewTests = knownRatings.length ? mean(knownRatings) : 50;

  const steps: FastestPathStep[] = [];

  for (const testId of OFFICIAL_TEST_IDS) {
    const test = TESTS[testId];
    const existing = bests[testId];
    const isNewTest = existing == null;

    const currentRating = existing?.rating ?? 0;
    const targetRating = clamp(
      isNewTest ? Math.round(baselineForNewTests) : currentRating + step,
      1,
      99,
    );
    if (!isNewTest && targetRating <= currentRating) continue;

    const targetValue = getValueForRating({
      testId,
      sex: subject.sex,
      age: subject.age,
      bodyWeightKg: subject.bodyWeightKg,
      targetRating,
    });
    if (targetValue == null) continue;

    const simulated = calculateOverallRating(
      simulate(bests, testId, targetRating, targetValue),
    );
    const overallGain = round((simulated.exact ?? 0) - currentExact, 2);
    if (overallGain <= 0) continue;

    const currentLabel = isNewTest
      ? 'non testé'
      : formatMetric(test, existing.metricValue, options.units);
    const targetLabel = formatMetric(test, targetValue, options.units);

    steps.push({
      testId,
      categoryId: test.category,
      currentValue: existing?.metricValue ?? null,
      targetValue,
      currentRating,
      targetRating,
      overallGain,
      reachability: isNewTest ? 0.9 : reachabilityOf(currentRating, targetRating),
      label: `${currentLabel} → ${targetLabel}`,
      isNewTest,
    });
  }

  // Rank by "Overall points per unit of effort", not by raw gain.
  steps.sort((a, b) => b.overallGain * b.reachability - a.overallGain * a.reachability);

  return {
    currentOverall: round(currentExact, 2),
    goalOverall: goal,
    steps,
    minimumSteps: minimumStepsToGoal(steps, currentExact, goal),
  };
}

/**
 * Greedy: take the most efficient steps until the goal is crossed. Gains are
 * additive here (each step targets a different test, so they do not interact).
 */
function minimumStepsToGoal(
  steps: FastestPathStep[],
  currentExact: number,
  goal: number,
): FastestPathStep[] {
  const needed = goal - currentExact;
  if (needed <= 0) return [];

  const chosen: FastestPathStep[] = [];
  let accumulated = 0;
  for (const s of steps) {
    if (accumulated >= needed) break;
    chosen.push(s);
    accumulated += s.overallGain;
  }
  return chosen;
}
