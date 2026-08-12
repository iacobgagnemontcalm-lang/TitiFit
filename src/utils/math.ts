export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Inverse lerp with a guard for zero-width ranges. */
export const inverseLerp = (a: number, b: number, v: number) =>
  b === a ? 0 : (v - a) / (b - a);

export const mean = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;

export const round = (value: number, decimals = 0) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

export const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

/** Population standard deviation. */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/**
 * Piecewise-linear interpolation through sorted `(x, y)` points, with linear
 * extrapolation past the ends using the slope of the outermost segment.
 */
export function interpolateCurve(
  points: { x: number; y: number }[],
  x: number,
): number {
  if (points.length === 0) return 0;
  const first = points[0]!;
  if (points.length === 1) return first.y;
  const last = points[points.length - 1]!;

  if (x <= first.x) {
    const second = points[1]!;
    const slope = (second.y - first.y) / (second.x - first.x || 1);
    return first.y + (x - first.x) * slope;
  }
  if (x >= last.x) {
    const prev = points[points.length - 2]!;
    const slope = (last.y - prev.y) / (last.x - prev.x || 1);
    return last.y + (x - last.x) * slope;
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (x >= a.x && x <= b.x) {
      return lerp(a.y, b.y, inverseLerp(a.x, b.x, x));
    }
  }
  return last.y;
}
