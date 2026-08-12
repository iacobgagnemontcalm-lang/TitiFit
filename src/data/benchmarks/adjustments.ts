import type { TestId } from '@/types';

/**
 * ⚠️ SIMULATED / HEURISTIC.
 *
 * Age and body-weight adjustments applied before a value is looked up in a
 * percentile table. Both are expressed in "performance space", where higher is
 * always better (times are inverted to speeds first).
 */

export type PerformanceQuality = 'strength' | 'power' | 'endurance' | 'muscular_endurance';

/** Which age curve applies to each test. */
export const TEST_QUALITY: Record<TestId, PerformanceQuality> = {
  deadlift: 'strength',
  back_squat: 'strength',
  bench_press: 'strength',
  overhead_press: 'strength',
  front_squat: 'strength',
  pull_ups: 'muscular_endurance',
  push_ups_60s: 'muscular_endurance',
  dips: 'muscular_endurance',
  plank_hold: 'muscular_endurance',
  hybrid_gauntlet: 'endurance',
  run_100m: 'power',
  run_300m: 'power',
  run_400m: 'power',
  run_1600m: 'endurance',
  run_5k: 'endurance',
  run_10k: 'endurance',
};

/**
 * Expected performance at a given age, relative to the peak age (=1.00).
 * Interpolated linearly between anchors, flat outside the range.
 */
export const AGE_CURVES: Record<PerformanceQuality, { age: number; factor: number }[]> = {
  strength: [
    { age: 14, factor: 0.72 },
    { age: 16, factor: 0.84 },
    { age: 18, factor: 0.92 },
    { age: 22, factor: 0.98 },
    { age: 27, factor: 1.0 },
    { age: 32, factor: 1.0 },
    { age: 37, factor: 0.97 },
    { age: 42, factor: 0.94 },
    { age: 47, factor: 0.9 },
    { age: 52, factor: 0.85 },
    { age: 57, factor: 0.8 },
    { age: 62, factor: 0.74 },
    { age: 70, factor: 0.64 },
    { age: 80, factor: 0.5 },
  ],
  power: [
    { age: 14, factor: 0.78 },
    { age: 16, factor: 0.87 },
    { age: 18, factor: 0.94 },
    { age: 22, factor: 1.0 },
    { age: 27, factor: 1.0 },
    { age: 32, factor: 0.98 },
    { age: 37, factor: 0.95 },
    { age: 42, factor: 0.92 },
    { age: 47, factor: 0.88 },
    { age: 52, factor: 0.83 },
    { age: 57, factor: 0.78 },
    { age: 62, factor: 0.72 },
    { age: 70, factor: 0.62 },
    { age: 80, factor: 0.48 },
  ],
  endurance: [
    { age: 14, factor: 0.8 },
    { age: 16, factor: 0.88 },
    { age: 18, factor: 0.94 },
    { age: 22, factor: 0.99 },
    { age: 27, factor: 1.0 },
    { age: 32, factor: 1.0 },
    { age: 37, factor: 0.98 },
    { age: 42, factor: 0.96 },
    { age: 47, factor: 0.93 },
    { age: 52, factor: 0.89 },
    { age: 57, factor: 0.85 },
    { age: 62, factor: 0.8 },
    { age: 70, factor: 0.71 },
    { age: 80, factor: 0.58 },
  ],
  muscular_endurance: [
    { age: 14, factor: 0.78 },
    { age: 16, factor: 0.88 },
    { age: 18, factor: 0.95 },
    { age: 22, factor: 1.0 },
    { age: 27, factor: 1.0 },
    { age: 32, factor: 0.99 },
    { age: 37, factor: 0.96 },
    { age: 42, factor: 0.93 },
    { age: 47, factor: 0.89 },
    { age: 52, factor: 0.85 },
    { age: 57, factor: 0.8 },
    { age: 62, factor: 0.74 },
    { age: 70, factor: 0.64 },
    { age: 80, factor: 0.5 },
  ],
};

/**
 * Allometric exponent `b` in `expected performance ∝ bodyWeight^b`, relative to
 * the distribution's reference body weight.
 *
 * Barbell lifts are already divided by body weight, so `b` here only captures
 * the *residual* penalty the ratio metric imposes on heavier athletes
 * (absolute strength scales ≈ BW^(2/3), so the ratio scales ≈ BW^(-1/3)).
 */
export const BODYWEIGHT_EXPONENT: Record<TestId, number> = {
  deadlift: -1 / 3,
  back_squat: -1 / 3,
  bench_press: -1 / 3,
  overhead_press: -1 / 3,
  front_squat: -1 / 3,
  pull_ups: -0.7,
  push_ups_60s: -0.35,
  dips: -0.6,
  plank_hold: -0.3,
  hybrid_gauntlet: -0.4,
  run_100m: -0.05,
  run_300m: -0.12,
  run_400m: -0.15,
  run_1600m: -0.3,
  run_5k: -0.35,
  run_10k: -0.4,
};

/** Body-weight adjustment is clamped so extreme weights cannot game the model. */
export const BODYWEIGHT_ADJUSTMENT_CLAMP = { min: 0.78, max: 1.28 } as const;
