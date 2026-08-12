import type { HeightUnit, WeightUnit } from '@/types';

export const LB_PER_KG = 2.2046226218;

export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;

export const toKg = (value: number, unit: WeightUnit) =>
  unit === 'kg' ? value : lbToKg(value);

export const fromKg = (kg: number, unit: WeightUnit) =>
  unit === 'kg' ? kg : kgToLb(kg);

export const cmToInches = (cm: number) => cm / 2.54;
export const inchesToCm = (inches: number) => inches * 2.54;

/** Formats a canonical kg value in the user's preferred unit. */
export function formatWeight(
  kg: number | null | undefined,
  unit: WeightUnit,
  opts: { decimals?: number; suffix?: boolean } = {},
): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  const { decimals = 0, suffix = true } = opts;
  const value = fromKg(kg, unit);
  const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return suffix ? `${rounded} ${unit}` : rounded;
}

export function formatHeight(cm: number | null | undefined, unit: HeightUnit): string {
  if (cm == null || !Number.isFinite(cm)) return '—';
  if (unit === 'cm') return `${Math.round(cm)} cm`;
  const totalInches = Math.round(cmToInches(cm));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

/** `74` -> `1:14`, `1242` -> `20:42`, `3725` -> `1:02:05`. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Parses `20:42`, `1:02:05` or `74` into seconds. Returns null if invalid. */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || Number.isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) return nums[0] ?? null;
  if (nums.length === 2) return (nums[0] ?? 0) * 60 + (nums[1] ?? 0);
  if (nums.length === 3) return (nums[0] ?? 0) * 3600 + (nums[1] ?? 0) * 60 + (nums[2] ?? 0);
  return null;
}

/** Pace per km or per mile, from total seconds over a distance in metres. */
export function formatPace(
  seconds: number,
  metres: number,
  unit: 'km' | 'mi' = 'km',
): string {
  if (!seconds || !metres) return '—';
  const perUnit = unit === 'km' ? 1000 : 1609.344;
  const paceSeconds = (seconds / metres) * perUnit;
  return `${formatDuration(paceSeconds)} /${unit}`;
}

/** Average speed in metres per second, formatted in km/h. */
export function formatSpeed(seconds: number, metres: number): string {
  if (!seconds || !metres) return '—';
  return `${((metres / seconds) * 3.6).toFixed(1)} km/h`;
}
