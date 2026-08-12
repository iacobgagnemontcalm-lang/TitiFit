import type { BenchmarkDistribution, BenchmarkSource, PercentileAnchor, TestId } from '@/types';

/**
 * ⚠️ SIMULATED DATA — see ./README.md
 *
 * Percentile anchors for a physically active / trained population.
 * Values are on each test's normalized metric:
 *   - barbell lifts : estimated 1RM ÷ body weight
 *   - rep tests     : valid reps
 *   - timed tests   : seconds (lower is better)
 */

const SIMULATED: BenchmarkSource = {
  kind: 'simulated',
  label: 'Données simulées — population entraînée',
  updatedAt: '2026-08-01',
};

const P = [5, 10, 25, 50, 75, 90, 95, 99];

const anchors = (values: number[]): PercentileAnchor[] =>
  P.map((percentile, i) => ({ percentile, value: values[i] ?? 0 }));

/** Reference athlete each table is calibrated on. */
const REFERENCE = {
  male: { age: 29, bodyWeightKg: 82 },
  female: { age: 29, bodyWeightKg: 64 },
} as const;

type Table = { male: number[]; female: number[] };

/** Ordered P5, P10, P25, P50, P75, P90, P95, P99. */
const TABLES: Record<TestId, Table> = {
  // --- Barbell lifts: 1RM / body weight ------------------------------------
  deadlift: {
    male: [1.0, 1.15, 1.45, 1.8, 2.15, 2.5, 2.7, 3.1],
    female: [0.75, 0.85, 1.05, 1.3, 1.6, 1.9, 2.05, 2.4],
  },
  back_squat: {
    male: [0.85, 0.95, 1.2, 1.5, 1.8, 2.1, 2.3, 2.65],
    female: [0.6, 0.7, 0.9, 1.1, 1.35, 1.6, 1.75, 2.05],
  },
  bench_press: {
    male: [0.6, 0.7, 0.9, 1.1, 1.35, 1.6, 1.75, 2.05],
    female: [0.35, 0.42, 0.55, 0.7, 0.85, 1.0, 1.1, 1.3],
  },
  overhead_press: {
    male: [0.4, 0.47, 0.6, 0.75, 0.9, 1.05, 1.15, 1.35],
    female: [0.24, 0.29, 0.38, 0.48, 0.58, 0.68, 0.75, 0.9],
  },
  front_squat: {
    male: [0.7, 0.8, 1.0, 1.25, 1.5, 1.75, 1.9, 2.2],
    female: [0.5, 0.58, 0.75, 0.92, 1.12, 1.32, 1.45, 1.7],
  },

  // --- Rep tests: valid reps ----------------------------------------------
  pull_ups: {
    male: [1, 2, 5, 9, 14, 20, 24, 32],
    female: [0, 0.5, 1.5, 3, 6, 10, 13, 18],
  },
  push_ups_60s: {
    male: [15, 20, 29, 38, 47, 56, 62, 73],
    female: [8, 12, 19, 26, 34, 42, 47, 57],
  },
  dips: {
    male: [3, 5, 10, 16, 23, 31, 36, 46],
    female: [0.5, 1, 3, 6, 10, 15, 18, 25],
  },
  plank_hold: {
    male: [45, 60, 90, 130, 180, 240, 285, 380],
    female: [40, 55, 85, 120, 168, 225, 265, 350],
  },

  // --- Timed tests: seconds (lower is better) ------------------------------
  run_400m: {
    male: [110, 104, 93, 83, 74, 67, 63, 57],
    female: [130, 123, 110, 99, 89, 80, 76, 68],
  },
  run_100m: {
    male: [19.5, 18.4, 16.5, 14.8, 13.4, 12.4, 11.9, 11.1],
    female: [23.0, 21.8, 19.6, 17.7, 16.1, 14.8, 14.2, 13.2],
  },
  run_300m: {
    male: [78, 73, 65, 58, 52, 47, 44.5, 40.5],
    female: [93, 88, 78, 70, 63, 57, 54, 49],
  },
  run_1600m: {
    male: [600, 565, 495, 435, 385, 342, 320, 285],
    female: [690, 650, 575, 510, 452, 402, 378, 336],
  },
  run_5k: {
    male: [2100, 1980, 1740, 1560, 1380, 1230, 1150, 1020],
    female: [2400, 2280, 2040, 1830, 1620, 1440, 1350, 1200],
  },
  run_10k: {
    male: [4500, 4260, 3720, 3300, 2910, 2580, 2400, 2130],
    female: [5100, 4860, 4320, 3870, 3420, 3030, 2820, 2490],
  },

  // --- Hybrid: TitiFit Gauntlet, seconds -----------------------------------
  hybrid_gauntlet: {
    male: [2160, 2010, 1740, 1500, 1290, 1110, 1020, 870],
    female: [2460, 2280, 1980, 1740, 1500, 1290, 1200, 1020],
  },
};

function build(testId: TestId, sex: 'male' | 'female'): BenchmarkDistribution {
  const ref = REFERENCE[sex];
  return {
    testId,
    sex,
    anchors: anchors(TABLES[testId][sex]),
    referenceAge: ref.age,
    referenceBodyWeightKg: ref.bodyWeightKg,
    source: SIMULATED,
  };
}

export const BENCHMARK_TABLES: BenchmarkDistribution[] = (
  Object.keys(TABLES) as TestId[]
).flatMap((testId) => [build(testId, 'male'), build(testId, 'female')]);

export const BENCHMARK_SOURCE = SIMULATED;
export const BENCHMARK_REFERENCE = REFERENCE;
