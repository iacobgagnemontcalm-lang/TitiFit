import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { alpha, colors, ratingColor, typography } from '@/theme';
import { clamp } from '@/utils/math';

import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RatingCircleProps {
  /** 0–100. `null` renders an empty ring with a dash. */
  rating: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
  /** Adds the second gradient stop for the hero ring on Home. */
  gradientTo?: string;
  animated?: boolean;
  valueVariant?: keyof typeof typography;
}

export function RatingCircle({
  rating,
  size = 120,
  strokeWidth = 10,
  label,
  color,
  gradientTo,
  animated = true,
  valueVariant,
}: RatingCircleProps) {
  const value = clamp(rating ?? 0, 0, 100);
  const tint = color ?? ratingColor(value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(animated ? 0 : value / 100);

  useEffect(() => {
    progress.value = animated
      ? withTiming(value / 100, { duration: 900, easing: Easing.out(Easing.cubic) })
      : value / 100;
  }, [value, animated, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const gradientId = `ring-${Math.round(size)}-${tint.replace('#', '')}`;
  const numberVariant =
    valueVariant ?? (size >= 150 ? 'display' : size >= 96 ? 'h1' : 'h2');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint} />
            <Stop offset="1" stopColor={gradientTo ?? alpha(tint, 0.55)} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={alpha(tint, 0.15)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <Text variant={numberVariant} color={colors.text.primary}>
          {rating == null ? '—' : Math.round(rating)}
        </Text>
        {label ? (
          <Text variant="overline" color={colors.text.faint} upper>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
