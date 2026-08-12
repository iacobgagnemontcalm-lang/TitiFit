import type { AthleteSummary, CategoryId } from '@/types';
import { calculateAthleteType, calculateCardTier } from '@/services/ratingEngine';

/**
 * ⚠️ MOCK ATHLETES — used by Leaderboard, Athlete VS and Combine until a real
 * backend exists. Ratings are stated directly rather than derived from results.
 */

interface RivalSeed {
  userId: string;
  username: string;
  displayName: string;
  level: number;
  location: string;
  categories: Record<CategoryId, number>;
}

const SEEDS: RivalSeed[] = [
  {
    userId: 'user_kevin',
    username: 'kevin',
    displayName: 'Kevin',
    level: 14,
    location: 'Montréal',
    categories: { strength: 82, bodyweight: 91, hybrid: 80, speed: 87, endurance: 76 },
  },
  {
    userId: 'user_maude',
    username: 'maude',
    displayName: 'Maude',
    level: 19,
    location: 'Québec',
    categories: { strength: 79, bodyweight: 88, hybrid: 90, speed: 84, endurance: 93 },
  },
  {
    userId: 'user_seb',
    username: 'seb',
    displayName: 'Seb',
    level: 11,
    location: 'Laval',
    categories: { strength: 93, bodyweight: 74, hybrid: 71, speed: 68, endurance: 62 },
  },
  {
    userId: 'user_alex',
    username: 'alexr',
    displayName: 'Alex',
    level: 16,
    location: 'Sherbrooke',
    categories: { strength: 71, bodyweight: 77, hybrid: 83, speed: 79, endurance: 88 },
  },
  {
    userId: 'user_jo',
    username: 'jo',
    displayName: 'Jo',
    level: 8,
    location: 'Gatineau',
    categories: { strength: 64, bodyweight: 61, hybrid: 58, speed: 66, endurance: 60 },
  },
  {
    userId: 'user_lea',
    username: 'lea',
    displayName: 'Léa',
    level: 22,
    location: 'Montréal',
    categories: { strength: 86, bodyweight: 94, hybrid: 92, speed: 90, endurance: 89 },
  },
  {
    userId: 'user_tom',
    username: 'tommy',
    displayName: 'Tom',
    level: 6,
    location: 'Trois-Rivières',
    categories: { strength: 55, bodyweight: 49, hybrid: 52, speed: 61, endurance: 57 },
  },
];

function toSummary(seed: RivalSeed): AthleteSummary {
  const values = Object.values(seed.categories);
  const overall = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const asCategoryRatings = Object.entries(seed.categories).reduce(
    (acc, [id, rating]) => ({
      ...acc,
      [id]: {
        categoryId: id as CategoryId,
        rating,
        percentile: rating,
        tests: [],
        completedTests: 1,
        totalTests: 1,
        isPartial: false,
      },
    }),
    {} as Parameters<typeof calculateAthleteType>[0],
  );

  return {
    userId: seed.userId,
    username: seed.username,
    displayName: seed.displayName,
    overall,
    tier: calculateCardTier(overall),
    athleteType: calculateAthleteType(asCategoryRatings, overall),
    level: seed.level,
    categories: seed.categories,
  };
}

export const RIVAL_ATHLETES: AthleteSummary[] = SEEDS.map(toSummary);

export const RIVAL_LOCATIONS: Record<string, string> = SEEDS.reduce(
  (acc, s) => ({ ...acc, [s.userId]: s.location }),
  {},
);
