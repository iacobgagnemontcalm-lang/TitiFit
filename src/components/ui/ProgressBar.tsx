import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { alpha, colors, radius } from '@/theme';
import { clamp } from '@/utils/math';

export interface ProgressBarProps {
  /** 0–1. */
  progress: number;
  color?: string;
  trailColor?: string;
  height?: number;
  gradient?: readonly [string, string, ...string[]];
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = colors.accent.primary,
  trailColor,
  height = 8,
  gradient,
  animated = true,
  style,
}: ProgressBarProps) {
  const target = clamp(progress, 0, 1);
  const value = useSharedValue(animated ? 0 : target);

  useEffect(() => {
    value.value = animated
      ? withTiming(target, { duration: 750, easing: Easing.out(Easing.cubic) })
      : target;
  }, [target, animated, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trailColor ?? alpha(color, 0.15) },
        style,
      ]}
    >
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
        <LinearGradient
          colors={gradient ?? [color, alpha(color, 0.65)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.pill },
  fill: { height: '100%', overflow: 'hidden' },
});
