import type { MetricUnit } from './units';

export type CategoryId = 'strength' | 'bodyweight' | 'hybrid' | 'speed' | 'endurance';

/** The 8 official tests that feed the Overall Rating. */
export type OfficialTestId =
  | 'deadlift'
  | 'back_squat'
  | 'bench_press'
  | 'pull_ups'
  | 'push_ups_60s'
  | 'hybrid_gauntlet'
  | 'run_400m'
  | 'run_5k';

/**
 * Secondary tests are logged and charted but never touch the Overall Rating
 * (per spec: only the official test of a category moves its rating).
 */
export type SecondaryTestId =
  | 'overhead_press'
  | 'front_squat'
  | 'run_100m'
  | 'run_300m'
  | 'run_1600m'
  | 'run_10k'
  | 'dips'
  | 'plank_hold';

export type TestId = OfficialTestId | SecondaryTestId;

/** How a raw value should be interpreted and ranked. */
export type ScoreDirection = 'higher_is_better' | 'lower_is_better';

/**
 * How a raw value is turned into the number the benchmark tables are keyed on.
 *  - `absolute`      : the raw value itself (times, rep counts)
 *  - `bodyweight_ratio`: raw / bodyWeightKg (barbell lifts)
 */
export type NormalizationMode = 'absolute' | 'bodyweight_ratio';

export type InputKind = 'weight_reps' | 'reps' | 'duration' | 'points';

export interface TestDefinition {
  id: TestId;
  category: CategoryId;
  /** Official tests are the only ones that feed category ratings. */
  official: boolean;
  name: string;
  shortName: string;
  /** One-line "what this measures". */
  tagline: string;
  /** Execution standard shown on the test detail + add-result screens. */
  standard: string[];
  inputKind: InputKind;
  unit: MetricUnit;
  direction: ScoreDirection;
  normalization: NormalizationMode;
  /** Allows entering `weight × reps` and estimating a 1RM. */
  supportsRepMax: boolean;
  icon: string;
}

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  /** Fixed at 0.20 each per spec. */
  weight: number;
  tagline: string;
  description: string;
  officialTests: OfficialTestId[];
  icon: string;
}
