import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { alpha, colors } from '@/theme';

export interface SparklinePoint {
  /** Any monotonically increasing x (timestamp, index…). */
  x: number;
  y: number;
}

export interface SparklineProps {
  points: SparklinePoint[];
  color?: string;
  height?: number;
  /** Set for time-based tests, where a *lower* value is an improvement. */
  lowerIsBetter?: boolean;
  showDots?: boolean;
}

/**
 * Minimal trend line. Deliberately axis-free: it answers "am I going up?" at a
 * glance, and the exact numbers live in the list underneath it.
 */
export function Sparkline({
  points,
  color = colors.accent.secondary,
  height = 72,
  lowerIsBetter = false,
  showDots = true,
}: SparklineProps) {
  if (points.length < 2) {
    return <View style={{ height }} />;
  }

  const W = 100;
  const H = 100;
  const PAD = 8;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const toX = (x: number) => PAD + ((x - minX) / spanX) * (W - PAD * 2);
  // For "lower is better" tests the axis is flipped so improvement always
  // points upward — otherwise a faster 5k would render as a decline.
  const toY = (y: number) => {
    const t = (y - minY) / spanY;
    const normalized = lowerIsBetter ? t : 1 - t;
    return PAD + normalized * (H - PAD * 2);
  };

  const coords = points.map((p) => ({ x: toX(p.x), y: toY(p.y) }));
  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L${coords[coords.length - 1]!.x.toFixed(2)},${H} L${coords[0]!.x.toFixed(2)},${H} Z`;

  const gradientId = `spark-${color.replace('#', '')}`;

  return (
    <View style={[styles.root, { height }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${gradientId})`} />
        <Path
          d={line}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {showDots
          ? coords.map((c, i) => (
              <Circle
                key={`${c.x}-${i}`}
                cx={c.x}
                cy={c.y}
                r={i === coords.length - 1 ? 2.6 : 1.6}
                fill={i === coords.length - 1 ? color : alpha(color, 0.6)}
                vectorEffect="non-scaling-stroke"
              />
            ))
          : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
});
