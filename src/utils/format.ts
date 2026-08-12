import type { TestDefinition, UnitPreferences } from '@/types';

import { formatDuration, formatWeight } from './units';

export const formatOrdinalPercentile = (p: number | null | undefined) =>
  p == null ? '—' : `P${Math.round(p)}`;

export const formatSigned = (value: number, decimals = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`;

export const formatXP = (xp: number) =>
  xp.toLocaleString('fr-CA').replace(/ | /g, ' ');

/**
 * Renders a canonical metric value for a given test in the user's units.
 * Lifts -> weight, runs -> duration, rep tests -> count, hybrid -> time.
 */
export function formatMetric(
  test: TestDefinition,
  value: number | null | undefined,
  units: UnitPreferences,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  switch (test.unit) {
    case 'kg':
      return formatWeight(value, units.weight);
    case 'seconds':
      return formatDuration(value);
    case 'reps':
      return `${Math.round(value)}`;
    case 'points':
      return `${Math.round(value)} pts`;
    default:
      return `${Math.round(value)}`;
  }
}

/** Short unit suffix for input fields. */
export function metricInputSuffix(test: TestDefinition, units: UnitPreferences): string {
  switch (test.unit) {
    case 'kg':
      return units.weight;
    case 'seconds':
      return 'mm:ss';
    case 'reps':
      return 'reps';
    case 'points':
      return 'pts';
    default:
      return '';
  }
}
