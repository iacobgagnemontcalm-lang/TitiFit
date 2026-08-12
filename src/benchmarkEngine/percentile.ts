import type { BenchmarkDistribution } from '@/types';
import { clamp, interpolateCurve } from '@/utils/math';

/** Percentiles are never reported outside this band — the tails are guesses. */
export const PERCENTILE_MIN = 1;
export const PERCENTILE_MAX = 99;

/**
 * Percentile → rating.
 *
 * Spec: P50≈50, P75≈75, P90≈90, P95≈95, P99≈99. That is the identity map
 * today, but it lives behind a function (and an anchor list) so the curve can
 * be re-shaped later without touching any caller.
 */
const RATING_ANCHORS: { percentile: number; rating: number }[] = [
  { percentile: 1, rating: 1 },
  { percentile: 50, rating: 50 },
  { percentile: 75, rating: 75 },
  { percentile: 90, rating: 90 },
  { percentile: 95, rating: 95 },
  { percentile: 99, rating: 99 },
];

export function percentileToRating(percentile: number): number {
  const points = RATING_ANCHORS.map((a) => ({ x: a.percentile, y: a.rating }));
  return clamp(interpolateCurve(points, percentile), 1, 99);
}

export function ratingToPercentile(rating: number): number {
  const points = RATING_ANCHORS.map((a) => ({ x: a.rating, y: a.percentile }));
  return clamp(interpolateCurve(points, rating), PERCENTILE_MIN, PERCENTILE_MAX);
}

/**
 * Reads a percentile off a distribution for a value already expressed on the
 * reference scale. Piecewise-linear between anchors, with the outermost slope
 * used for extrapolation, then clamped to [1, 99].
 */
export function percentileForReferenceValue(
  distribution: BenchmarkDistribution,
  referenceValue: number,
): number {
  const points = distribution.anchors
    .map((a) => ({ x: a.value, y: a.percentile }))
    .sort((a, b) => a.x - b.x);

  return clamp(interpolateCurve(points, referenceValue), PERCENTILE_MIN, PERCENTILE_MAX);
}

/** Inverse: the reference-scale value that sits at a given percentile. */
export function referenceValueForPercentile(
  distribution: BenchmarkDistribution,
  percentile: number,
): number {
  const points = distribution.anchors
    .map((a) => ({ x: a.percentile, y: a.value }))
    .sort((a, b) => a.x - b.x);

  return interpolateCurve(points, clamp(percentile, PERCENTILE_MIN, PERCENTILE_MAX));
}
