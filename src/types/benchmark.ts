import type { TestId } from './tests';
import type { Sex } from './user';

/**
 * A single point on a percentile curve, expressed in the test's *normalized*
 * metric (bodyweight ratio for lifts, seconds for runs, reps for rep tests).
 */
export interface PercentileAnchor {
  percentile: number;
  value: number;
}

/**
 * A reference distribution for one test × sex, expressed as percentile
 * anchors on a reference athlete (see `referenceAge` / `referenceBodyWeightKg`).
 * Age and body-weight adjustments are applied on top by the engine.
 */
export interface BenchmarkDistribution {
  testId: TestId;
  sex: Sex;
  anchors: PercentileAnchor[];
  referenceAge: number;
  referenceBodyWeightKg: number;
  /**
   * Provenance. `simulated` means the numbers are plausible placeholders and
   * MUST be surfaced as such in the UI.
   */
  source: BenchmarkSource;
}

export interface BenchmarkSource {
  kind: 'simulated' | 'derived' | 'measured';
  label: string;
  /** Number of real observations, when known. */
  sampleSize?: number;
  updatedAt?: string;
}

export interface BenchmarkQuery {
  testId: TestId;
  sex: Sex;
  age: number;
  bodyWeightKg: number;
  /** Raw metric value in the test's canonical unit. */
  value: number;
}

export interface PercentileResult {
  percentile: number;
  rating: number;
  /** The value after normalization + age/weight adjustment. */
  normalizedValue: number;
  /** Group the athlete was ranked against, for display. */
  comparisonGroup: string;
  source: BenchmarkSource;
  /** True when the distribution used is placeholder data. */
  isSimulated: boolean;
}

/** Inverse lookup: "what would I need to hit to reach this rating?" */
export interface TargetLookup {
  testId: TestId;
  sex: Sex;
  age: number;
  bodyWeightKg: number;
  targetRating: number;
}

/**
 * Swappable data source. The mock tables implement this today; a Supabase or
 * REST-backed provider can implement the same interface later with no changes
 * to the rating layer or the UI.
 */
export interface BenchmarkProvider {
  readonly id: string;
  getDistribution(testId: TestId, sex: Sex): BenchmarkDistribution | undefined;
}
