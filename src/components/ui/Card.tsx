import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { alpha, colors, elevation, glow, radius, spacing } from '@/theme';

export interface CardProps {
  children: ReactNode;
  /** Coloured hairline + soft outer glow. */
  accent?: string;
  glowIntensity?: 'sm' | 'md' | 'lg';
  gradient?: readonly [string, string, ...string[]];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({
  children,
  accent,
  glowIntensity = 'sm',
  gradient,
  onPress,
  style,
  padded = true,
}: CardProps) {
  const body = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        accent ? { borderColor: alpha(accent, 0.35) } : null,
        accent ? glow(accent, glowIntensity) : elevation.card,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient ?? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.012)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
