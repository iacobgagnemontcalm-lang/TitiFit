import type { TestId } from './tests';

export type RPE = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** What the user physically typed in, before any estimation. */
export interface RawEntry {
  /** Barbell lifts: load in kg. */
  weightKg?: number;
  /** Barbell lifts: reps performed at that load (1 = a true 1RM). */
  reps?: number;
  /** Rep tests: total valid reps. */
  count?: number;
  /** Timed tests: seconds. */
  seconds?: number;
  /** Points-scored tests (Hybrid). */
  points?: number;
}

export interface TestResult {
  id: string;
  testId: TestId;
  /** ISO date of the performance (not of the entry). */
  date: string;
  raw: RawEntry;
  /**
   * The single number the engines rank. Canonical unit per TestDefinition:
   * kg (estimated 1RM for lifts), reps, or seconds.
   */
  metricValue: number;
  /** True when `metricValue` came from a rep-max formula rather than a 1RM. */
  estimated: boolean;
  /** Body weight at the time of the test — needed for ratio-based tests. */
  bodyWeightKg: number;
  rpe?: RPE;
  notes?: string;
  photoUri?: string;
  videoUri?: string;
  /** Manually entered or estimated energy cost, used by Beer Earned. */
  calories?: number;
  createdAt: string;
}

/** The engine output attached to a result once it has been scored. */
export interface ScoredResult extends TestResult {
  percentile: number;
  rating: number;
  isPR: boolean;
  /** Percentile delta vs the previous best, when there was one. */
  percentileDelta?: number;
  xpAwarded: number;
}

export interface PersonalRecord {
  testId: TestId;
  resultId: string;
  metricValue: number;
  percentile: number;
  rating: number;
  date: string;
}
