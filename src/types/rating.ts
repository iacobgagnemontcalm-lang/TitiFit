import type { CategoryId, OfficialTestId } from './tests';

export type CardTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'elite'
  | 'legendary';

export type AthleteTypeId =
  | 'powerhouse'
  | 'engine'
  | 'speedster'
  | 'gymnast'
  | 'workhorse'
  | 'all_rounder'
  | 'power_hybrid'
  | 'hybrid_elite'
  | 'unranked';

export interface TestRating {
  testId: OfficialTestId;
  /** Null when the test has never been completed. */
  rating: number | null;
  percentile: number | null;
  metricValue: number | null;
  isSimulatedBenchmark: boolean;
  date?: string;
}

export interface CategoryRating {
  categoryId: CategoryId;
  /** Null until at least one official test in the category is completed. */
  rating: number | null;
  /** Mean percentile of the completed tests in the category. */
  percentile: number | null;
  tests: TestRating[];
  completedTests: number;
  totalTests: number;
  /** True when some but not all tests in the category are done. */
  isPartial: boolean;
}

export interface OverallRating {
  /** Rounded 0–100 value shown on the card. Null when nothing is logged. */
  value: number | null;
  /** Unrounded, for deltas and projections. */
  exact: number | null;
  percentile: number | null;
  categories: Record<CategoryId, CategoryRating>;
  /** 0–1: share of the 8 official tests completed. */
  completeness: number;
  /**
   * True when the Overall was computed over fewer than 5 categories
   * (weights renormalized). The UI must label it as provisional.
   */
  isProvisional: boolean;
  tier: CardTier;
  athleteType: AthleteTypeId;
}

export interface AthleteTypeDefinition {
  id: AthleteTypeId;
  name: string;
  description: string;
  /**
   * Relative emphasis per category, used to score how well an athlete's
   * *shape* (deviation from their own mean) matches the archetype.
   */
  emphasis: Partial<Record<CategoryId, number>>;
  /** Minimum Overall required to be eligible. */
  minOverall?: number;
  /** Maximum spread between categories (all-rounder style archetypes). */
  maxSpread?: number;
  /** Minimum spread required (specialist archetypes). */
  minSpread?: number;
  icon: string;
}

export interface TierDefinition {
  id: CardTier;
  name: string;
  min: number;
  max: number;
}

/** One suggested improvement produced by the Fastest Path engine. */
export interface FastestPathStep {
  testId: OfficialTestId;
  categoryId: CategoryId;
  currentValue: number | null;
  targetValue: number;
  currentRating: number;
  targetRating: number;
  /** Overall points gained if this single step is achieved. */
  overallGain: number;
  /** 0–1 heuristic: how reachable this step is from where the athlete is. */
  reachability: number;
  /** Human-readable "20:42 → 20:15". */
  label: string;
  /** Set when the test has never been done — completing it is the win. */
  isNewTest: boolean;
}

export interface FastestPathPlan {
  currentOverall: number;
  goalOverall: number;
  steps: FastestPathStep[];
  /** Steps needed (in order) to actually cross the goal. */
  minimumSteps: FastestPathStep[];
}

export interface ProjectedRating {
  current: number;
  projected: number;
  weeks: number;
  /** Overall points gained per week over the observed window. */
  weeklyRate: number;
  /** 'low' when we have very little history to extrapolate from. */
  confidence: 'low' | 'medium' | 'high';
}

export interface JourneyPoint {
  /** `YYYY-MM` */
  month: string;
  overall: number;
  tier: CardTier;
}
