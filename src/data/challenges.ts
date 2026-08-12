import { palette } from '@/theme/colors';
import type { Challenge } from '@/types';

/** Seed challenges for the prototype. A backend would serve these later. */
export const CHALLENGES: Challenge[] = [
  {
    id: 'ch_august_hybrid_2026',
    scope: 'monthly',
    name: 'August Hybrid',
    description: 'Un mois pour prouver que ton moteur tient sous charge.',
    goals: [
      { kind: 'workouts', target: 12 },
      { kind: 'distance_metres', target: 50_000 },
      { kind: 'reps', testId: 'pull_ups', target: 500 },
    ],
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    xpReward: 500,
    badgeId: 'badge_august_hybrid',
    accent: palette.orange,
  },
  {
    id: 'ch_weekly_consistency',
    scope: 'weekly',
    name: 'Semaine solide',
    description: 'Trois séances enregistrées cette semaine.',
    goals: [{ kind: 'workouts', target: 3 }],
    startDate: '2026-08-10',
    endDate: '2026-08-16',
    xpReward: 150,
    accent: palette.cyan,
  },
  {
    id: 'ch_complete_profile',
    scope: 'community',
    name: 'Full Combine',
    description: 'Compléter les huit tests officiels au moins une fois.',
    goals: [{ kind: 'tests_completed', target: 8 }],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    xpReward: 500,
    badgeId: 'badge_full_combine',
    accent: palette.violet,
  },
];
