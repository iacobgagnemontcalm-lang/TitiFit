import type { UnitPreferences } from './units';

/**
 * Biological sex is used strictly as a benchmarking variable — comparison
 * groups for strength/speed/endurance norms are sex-separated. `other` falls
 * back to a blended distribution (see benchmarkEngine).
 */
export type Sex = 'male' | 'female' | 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

/** Self-declared sessions per week at signup; refined later by real activity. */
export type TrainingFrequency = '1-2' | '3-4' | '5-6' | '7+';

export interface UserLocation {
  city?: string;
  region?: string;
  country?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  sex: Sex;
  /** ISO `YYYY-MM-DD`. Age is always derived from this, never stored. */
  birthDate: string;
  /** Canonical: centimetres. */
  heightCm: number;
  /** Canonical: kilograms. Latest known body weight. */
  bodyWeightKg: number;
  experience: ExperienceLevel;
  trainingFrequency: TrainingFrequency;
  units: UnitPreferences;
  location?: UserLocation;
  createdAt: string;
}

/** A dated body-weight entry, so ratios can be recomputed historically. */
export interface BodyWeightEntry {
  date: string;
  weightKg: number;
}

/** The subset of the user the benchmark engine needs to pick a peer group. */
export interface ComparisonSubject {
  sex: Sex;
  age: number;
  bodyWeightKg: number;
  heightCm?: number;
}
