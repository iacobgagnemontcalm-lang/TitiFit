import { TESTS } from '@/data/tests';
import type {
  BenchmarkProvider,
  BenchmarkQuery,
  PercentileResult,
  Sex,
  TargetLookup,
  TestId,
} from '@/types';
import { clamp } from '@/utils/math';

import {
  denormalizeMetric,
  fromReferenceScale,
  normalizeMetric,
  toReferenceScale,
  type AdjustmentContext,
} from './normalize';
import {
  percentileForReferenceValue,
  percentileToRating,
  ratingToPercentile,
  referenceValueForPercentile,
} from './percentile';
import { MockBenchmarkProvider } from './provider';

export * from './percentile';
export { MockBenchmarkProvider } from './provider';
export { ageFactor, bodyWeightFactor, normalizeMetric } from './normalize';

// ---------------------------------------------------------------------------
// Provider registry — the single seam between the app and its statistics.
// ---------------------------------------------------------------------------

let provider: BenchmarkProvider = new MockBenchmarkProvider();

export function setBenchmarkProvider(next: BenchmarkProvider): void {
  provider = next;
}

export function getBenchmarkProvider(): BenchmarkProvider {
  return provider;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function describeGroup(sex: Sex, age: number): string {
  const decade = Math.floor(age / 5) * 5;
  const sexLabel = sex === 'male' ? 'H' : sex === 'female' ? 'F' : 'Mixte';
  return `${sexLabel} ${decade}-${decade + 4} ans · actifs`;
}

function contextFor(query: Omit<BenchmarkQuery, 'value'>): AdjustmentContext | null {
  const distribution = provider.getDistribution(query.testId, query.sex);
  if (!distribution) return null;
  return {
    testId: query.testId,
    age: query.age,
    bodyWeightKg: query.bodyWeightKg,
    distribution,
  };
}

/**
 * Ranks a performance against the athlete's comparison group.
 *
 * ```ts
 * benchmarkEngine.getPercentile({
 *   testId: 'deadlift', sex: 'male', age: 29, bodyWeightKg: 81.6, value: 174.6,
 * });
 * // -> { percentile: 92, rating: 92, ... }
 * ```
 */
export function getPercentile(query: BenchmarkQuery): PercentileResult | null {
  const ctx = contextFor(query);
  if (!ctx) return null;

  const normalized = normalizeMetric(query.testId, query.value, query.bodyWeightKg);
  const referenceValue = toReferenceScale(normalized, ctx);
  const percentile = percentileForReferenceValue(ctx.distribution, referenceValue);

  return {
    percentile: Math.round(percentile * 10) / 10,
    rating: Math.round(percentileToRating(percentile)),
    normalizedValue: normalized,
    comparisonGroup: describeGroup(query.sex, query.age),
    source: ctx.distribution.source,
    isSimulated: ctx.distribution.source.kind === 'simulated',
  };
}

/**
 * Inverse lookup used by Fastest Path and by the "next target" pills:
 * the raw performance this athlete would need for a given rating.
 */
export function getValueForRating(lookup: TargetLookup): number | null {
  const ctx = contextFor(lookup);
  if (!ctx) return null;

  const percentile = ratingToPercentile(clamp(lookup.targetRating, 1, 99));
  const referenceValue = referenceValueForPercentile(ctx.distribution, percentile);
  const normalized = fromReferenceScale(referenceValue, ctx);
  return denormalizeMetric(lookup.testId, normalized, lookup.bodyWeightKg);
}

/** True when the numbers backing a test are placeholder data. */
export function isSimulated(testId: TestId, sex: Sex): boolean {
  return provider.getDistribution(testId, sex)?.source.kind === 'simulated';
}

export function hasBenchmark(testId: TestId, sex: Sex): boolean {
  return provider.getDistribution(testId, sex) != null;
}

/** Direction-aware "is A better than B" for any test. */
export function isBetter(testId: TestId, a: number, b: number): boolean {
  return TESTS[testId].direction === 'lower_is_better' ? a < b : a > b;
}

export const benchmarkEngine = {
  getPercentile,
  getValueForRating,
  isSimulated,
  hasBenchmark,
  isBetter,
  setProvider: setBenchmarkProvider,
  getProvider: getBenchmarkProvider,
};
