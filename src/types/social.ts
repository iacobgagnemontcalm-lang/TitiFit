import type { CardTier, AthleteTypeId } from './rating';
import type { CategoryId, OfficialTestId } from './tests';
import type { Sex } from './user';

export type LeaderboardScope =
  | 'friends'
  | 'city'
  | 'region'
  | 'country'
  | 'world';

export type LeaderboardMetric =
  | { kind: 'overall' }
  | { kind: 'category'; categoryId: CategoryId }
  | { kind: 'test'; testId: OfficialTestId };

export interface LeaderboardFilters {
  scope: LeaderboardScope;
  metric: LeaderboardMetric;
  sex?: Sex | 'all';
  ageMin?: number;
  ageMax?: number;
  weightMinKg?: number;
  weightMaxKg?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUri?: string;
  value: number;
  /** Formatted for display (e.g. "20:42", "185 kg", "88"). */
  displayValue: string;
  tier: CardTier;
  athleteType: AthleteTypeId;
  isCurrentUser: boolean;
  location?: string;
}

export interface AthleteSummary {
  userId: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  overall: number;
  tier: CardTier;
  athleteType: AthleteTypeId;
  level: number;
  categories: Record<CategoryId, number | null>;
}

export interface CategoryDuel {
  categoryId: CategoryId;
  a: number | null;
  b: number | null;
  winner: 'a' | 'b' | 'tie';
}

export interface AthleteComparison {
  a: AthleteSummary;
  b: AthleteSummary;
  duels: CategoryDuel[];
  scoreA: number;
  scoreB: number;
  winner: 'a' | 'b' | 'tie';
}

// --- Combine ---------------------------------------------------------------

export interface CombineParticipant {
  userId: string;
  username: string;
  avatarUri?: string;
}

export interface Combine {
  id: string;
  name: string;
  date: string;
  hostUserId: string;
  testIds: OfficialTestId[];
  participants: CombineParticipant[];
  status: 'draft' | 'open' | 'completed';
}

export interface CombineStanding {
  userId: string;
  username: string;
  points: number;
  rank: number;
  perTestRank: Partial<Record<OfficialTestId, number>>;
  awards: string[];
}
