export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type HeightUnit = 'cm' | 'ftin';

export interface UnitPreferences {
  weight: WeightUnit;
  distance: DistanceUnit;
  height: HeightUnit;
}

export const DEFAULT_UNITS: UnitPreferences = {
  weight: 'lb',
  distance: 'km',
  height: 'cm',
};

/**
 * Every value stored in the app is kept in one canonical unit so the engines
 * never have to care about display preferences:
 *   - mass      -> kilograms
 *   - length    -> centimetres
 *   - duration  -> seconds
 *   - distance  -> metres
 *   - reps      -> count
 */
export type MetricUnit = 'kg' | 'cm' | 'seconds' | 'metres' | 'reps' | 'points';
