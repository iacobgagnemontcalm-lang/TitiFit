import {
  AGE_CURVES,
  BODYWEIGHT_ADJUSTMENT_CLAMP,
  BODYWEIGHT_EXPONENT,
  TEST_QUALITY,
} from '@/data/benchmarks/adjustments';
import { TESTS } from '@/data/tests';
import type { BenchmarkDistribution, TestId } from '@/types';
import { clamp, interpolateCurve } from '@/utils/math';

/**
 * Everything in this file works in **performance space**, where higher is
 * always better. Timed tests are inverted (speed = 1 / seconds) on the way in
 * and re-inverted on the way out, so a single set of adjustments covers all
 * tests.
 */

export const toPerformance = (testId: TestId, value: number): number =>
  TESTS[testId].direction === 'lower_is_better' ? 1 / Math.max(value, 0.001) : value;

export const fromPerformance = (testId: TestId, performance: number): number =>
  TESTS[testId].direction === 'lower_is_better'
    ? 1 / Math.max(performance, 1e-9)
    : performance;

/** Expected performance at `age`, relative to the peak age. */
export function ageFactor(testId: TestId, age: number): number {
  const curve = AGE_CURVES[TEST_QUALITY[testId]];
  const points = curve.map((c) => ({ x: c.age, y: c.factor }));
  const first = curve[0]!;
  const last = curve[curve.length - 1]!;
  if (age <= first.age) return first.factor;
  if (age >= last.age) return last.factor;
  return interpolateCurve(points, age);
}

/** Expected performance at `bodyWeightKg`, relative to the reference weight. */
export function bodyWeightFactor(
  testId: TestId,
  bodyWeightKg: number,
  referenceBodyWeightKg: number,
): number {
  const exponent = BODYWEIGHT_EXPONENT[testId] ?? 0;
  const ratio = Math.max(bodyWeightKg, 30) / referenceBodyWeightKg;
  const raw = ratio ** exponent;
  return clamp(raw, BODYWEIGHT_ADJUSTMENT_CLAMP.min, BODYWEIGHT_ADJUSTMENT_CLAMP.max);
}

/** Raw canonical value → the metric the percentile table is keyed on. */
export function normalizeMetric(
  testId: TestId,
  value: number,
  bodyWeightKg: number,
): number {
  return TESTS[testId].normalization === 'bodyweight_ratio'
    ? value / Math.max(bodyWeightKg, 1)
    : value;
}

/** Inverse of {@link normalizeMetric}. */
export function denormalizeMetric(
  testId: TestId,
  normalized: number,
  bodyWeightKg: number,
): number {
  return TESTS[testId].normalization === 'bodyweight_ratio'
    ? normalized * Math.max(bodyWeightKg, 1)
    : normalized;
}

export interface AdjustmentContext {
  testId: TestId;
  age: number;
  bodyWeightKg: number;
  distribution: BenchmarkDistribution;
}

/**
 * Maps a real athlete's normalized value onto the reference athlete's scale,
 * so the percentile table can be read directly.
 */
export function toReferenceScale(normalized: number, ctx: AdjustmentContext): number {
  const { testId, age, bodyWeightKg, distribution } = ctx;
  const factor =
    ageFactor(testId, age) *
    bodyWeightFactor(testId, bodyWeightKg, distribution.referenceBodyWeightKg) *
    (ageFactor(testId, distribution.referenceAge) === 0
      ? 1
      : 1 / ageFactor(testId, distribution.referenceAge));

  const performance = toPerformance(testId, normalized);
  return fromPerformance(testId, performance / (factor || 1));
}

/** Inverse of {@link toReferenceScale}. */
export function fromReferenceScale(referenceValue: number, ctx: AdjustmentContext): number {
  const { testId, age, bodyWeightKg, distribution } = ctx;
  const factor =
    ageFactor(testId, age) *
    bodyWeightFactor(testId, bodyWeightKg, distribution.referenceBodyWeightKg) *
    (1 / (ageFactor(testId, distribution.referenceAge) || 1));

  const performance = toPerformance(testId, referenceValue);
  return fromPerformance(testId, performance * (factor || 1));
}
