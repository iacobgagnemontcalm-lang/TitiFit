import type { RawEntry, TestId, TestResult, User } from '@/types';
import { createId } from '@/utils/id';

/**
 * ⚠️ DEMO DATA — a seeded athlete so every screen has something to render
 * before the user logs anything. Wiped by "Réinitialiser" in Settings.
 *
 * The arc is intentional: ~67 OVR in June, ~78 in July, ~84 in August, so the
 * Athlete Journey and the projection have a real trend to work with.
 */

export const DEMO_USER: User = {
  id: 'user_demo_nick',
  username: 'nick',
  displayName: 'Nick',
  sex: 'male',
  birthDate: '1997-03-14',
  heightCm: 180,
  bodyWeightKg: 82,
  experience: 'advanced',
  trainingFrequency: '5-6',
  units: { weight: 'lb', distance: 'km', height: 'cm' },
  location: { city: 'Montréal', region: 'Québec', country: 'Canada' },
  createdAt: '2026-06-01',
};

interface Seed {
  testId: TestId;
  date: string;
  raw: RawEntry;
  metricValue: number;
  estimated?: boolean;
}

/** 1RM values below are pre-computed with the same Epley/Brzycki average the app uses. */
const SEEDS: Seed[] = [
  // --- June: the starting point ---------------------------------------------
  { testId: 'deadlift', date: '2026-06-04', raw: { weightKg: 160, reps: 3 }, metricValue: 172.7, estimated: true },
  { testId: 'back_squat', date: '2026-06-06', raw: { weightKg: 140, reps: 2 }, metricValue: 146.7, estimated: true },
  { testId: 'bench_press', date: '2026-06-06', raw: { weightKg: 100, reps: 3 }, metricValue: 107.9, estimated: true },
  { testId: 'pull_ups', date: '2026-06-09', raw: { count: 15 }, metricValue: 15 },
  { testId: 'push_ups_60s', date: '2026-06-09', raw: { count: 42 }, metricValue: 42 },
  { testId: 'run_400m', date: '2026-06-13', raw: { seconds: 79 }, metricValue: 79 },
  { testId: 'run_5k', date: '2026-06-16', raw: { seconds: 1420 }, metricValue: 1420 },
  { testId: 'hybrid_gauntlet', date: '2026-06-21', raw: { seconds: 1410 }, metricValue: 1410 },

  // --- July: the build ------------------------------------------------------
  { testId: 'deadlift', date: '2026-07-07', raw: { weightKg: 175, reps: 2 }, metricValue: 183.4, estimated: true },
  { testId: 'back_squat', date: '2026-07-09', raw: { weightKg: 152, reps: 2 }, metricValue: 159.2, estimated: true },
  { testId: 'bench_press', date: '2026-07-09', raw: { weightKg: 110, reps: 2 }, metricValue: 115.2, estimated: true },
  { testId: 'pull_ups', date: '2026-07-14', raw: { count: 19 }, metricValue: 19 },
  { testId: 'push_ups_60s', date: '2026-07-14', raw: { count: 46 }, metricValue: 46 },
  { testId: 'run_400m', date: '2026-07-18', raw: { seconds: 75 }, metricValue: 75 },
  { testId: 'run_5k', date: '2026-07-21', raw: { seconds: 1310 }, metricValue: 1310 },
  { testId: 'hybrid_gauntlet', date: '2026-07-26', raw: { seconds: 1300 }, metricValue: 1300 },

  // --- August: where the card sits today ------------------------------------
  { testId: 'run_5k', date: '2026-08-02', raw: { seconds: 1242 }, metricValue: 1242 },
  { testId: 'deadlift', date: '2026-08-04', raw: { weightKg: 190, reps: 2 }, metricValue: 199.1, estimated: true },
  { testId: 'back_squat', date: '2026-08-05', raw: { weightKg: 165, reps: 1 }, metricValue: 165 },
  { testId: 'bench_press', date: '2026-08-05', raw: { weightKg: 120, reps: 1 }, metricValue: 120 },
  { testId: 'pull_ups', date: '2026-08-07', raw: { count: 22 }, metricValue: 22 },
  { testId: 'push_ups_60s', date: '2026-08-07', raw: { count: 50 }, metricValue: 50 },
  { testId: 'run_400m', date: '2026-08-09', raw: { seconds: 72 }, metricValue: 72 },
  { testId: 'hybrid_gauntlet', date: '2026-08-11', raw: { seconds: 1215 }, metricValue: 1215 },
];

export function buildDemoResults(): TestResult[] {
  return SEEDS.map((seed) => ({
    id: createId('res'),
    testId: seed.testId,
    date: seed.date,
    raw: seed.raw,
    metricValue: seed.metricValue,
    estimated: seed.estimated ?? false,
    bodyWeightKg: DEMO_USER.bodyWeightKg,
    createdAt: `${seed.date}T18:00:00.000Z`,
  }));
}
