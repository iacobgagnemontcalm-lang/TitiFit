import type { CategoryId, TestId } from './tests';

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------

export type XPReason =
  | 'result_logged'
  | 'personal_record'
  | 'big_improvement'
  | 'first_time_test'
  | 'all_tests_complete'
  | 'streak_week'
  | 'challenge_complete'
  | 'achievement_unlocked'
  | 'tier_upgrade';

export interface XPTransaction {
  id: string;
  amount: number;
  reason: XPReason;
  label: string;
  date: string;
  /** Result / achievement / challenge id this XP came from. */
  sourceId?: string;
}

export interface LevelState {
  level: number;
  totalXP: number;
  /** XP accumulated inside the current level. */
  xpIntoLevel: number;
  /** XP needed to complete the current level. */
  xpForLevel: number;
  progress: number;
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export type AchievementCategory =
  | 'strength'
  | 'bodyweight'
  | 'speed'
  | 'endurance'
  | 'hybrid'
  | 'consistency'
  | 'fun';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * A declarative unlock condition, evaluated by the achievement engine so new
 * achievements can be added as data instead of code.
 */
export type AchievementCondition =
  | { kind: 'bodyweight_multiple'; testId: TestId; multiple: number }
  | { kind: 'metric_at_least'; testId: TestId; value: number }
  | { kind: 'metric_at_most'; testId: TestId; value: number }
  | { kind: 'rating_at_least'; categoryId: CategoryId; rating: number }
  | { kind: 'overall_at_least'; rating: number }
  | { kind: 'streak_weeks'; weeks: number }
  | { kind: 'total_results'; count: number }
  | { kind: 'all_tests_completed' }
  | { kind: 'beers_earned'; beers: number };

export interface Achievement {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  description: string;
  condition: AchievementCondition;
  xp: number;
  icon: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  date: string;
}

/** Achievement + live progress, for the achievements grid. */
export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  /** 0–1 progress toward the condition when it is measurable. */
  progress: number;
  progressLabel?: string;
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface StreakConfig {
  /** Activities required inside a week for it to count as "active". */
  activitiesPerWeek: number;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn: 0 | 1;
}

export interface StreakState {
  current: number;
  longest: number;
  /** Activities logged in the in-progress week. */
  activitiesThisWeek: number;
  activitiesNeeded: number;
  /** True when this week already counts. */
  weekSecured: boolean;
  lastActiveWeek?: string;
}

// ---------------------------------------------------------------------------
// Beer Earned (humorous energy-equivalent metric — not a drinking suggestion)
// ---------------------------------------------------------------------------

export interface BeerSettings {
  enabled: boolean;
  /** kcal of the reference beer. Default 165 (12 oz regular lager). */
  referenceKcal: number;
}

export interface BeerSummary {
  today: number;
  week: number;
  month: number;
  allTime: number;
  kcalAllTime: number;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export type ChallengeScope = 'daily' | 'weekly' | 'monthly' | 'community';

export type ChallengeGoal =
  | { kind: 'workouts'; target: number }
  | { kind: 'distance_metres'; target: number }
  | { kind: 'reps'; testId: TestId; target: number }
  | { kind: 'tests_completed'; target: number };

export interface Challenge {
  id: string;
  scope: ChallengeScope;
  name: string;
  description: string;
  goals: ChallengeGoal[];
  startDate: string;
  endDate: string;
  xpReward: number;
  badgeId?: string;
  accent: string;
}

export interface ChallengeProgress {
  challenge: Challenge;
  /** Per-goal completion 0–1, same order as `challenge.goals`. */
  goalProgress: number[];
  progress: number;
  completed: boolean;
}
