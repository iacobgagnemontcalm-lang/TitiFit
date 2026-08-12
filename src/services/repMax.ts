import { clamp } from '@/utils/math';

/**
 * Estimated 1RM from a `weight × reps` set.
 *
 * Averages Epley and Brzycki, which disagree in opposite directions and track
 * real lifters better together than either alone. Only trustworthy up to ~12
 * reps, so the input is clamped and the caller is told it is an estimate.
 */
export const MAX_ESTIMABLE_REPS = 12;

export function epley(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export function brzycki(weightKg: number, reps: number): number {
  return weightKg * (36 / (37 - reps));
}

export interface OneRepMax {
  value: number;
  estimated: boolean;
  /** True when reps exceeded the range the formulas are reliable in. */
  lowConfidence: boolean;
}

export function estimateOneRepMax(weightKg: number, reps: number): OneRepMax {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(reps) || reps < 1) {
    return { value: 0, estimated: false, lowConfidence: true };
  }
  if (reps === 1) return { value: weightKg, estimated: false, lowConfidence: false };

  const r = clamp(reps, 1, MAX_ESTIMABLE_REPS);
  const value = (epley(weightKg, r) + brzycki(weightKg, r)) / 2;
  return {
    value: Math.round(value * 10) / 10,
    estimated: true,
    lowConfidence: reps > MAX_ESTIMABLE_REPS,
  };
}

/** Weight that should be liftable for `reps`, given a 1RM. Inverse of Epley. */
export function weightForReps(oneRepMaxKg: number, reps: number): number {
  return oneRepMaxKg / (1 + clamp(reps, 1, MAX_ESTIMABLE_REPS) / 30);
}
