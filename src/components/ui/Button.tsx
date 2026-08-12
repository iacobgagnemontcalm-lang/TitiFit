import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, colors, glow, gradients, radius, spacing } from '@/theme';

import { Text } from './Text';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  full = true,
  style,
}: ButtonProps) {
  const tint =
    variant === 'primary' ? colors.palette.white : colors.accent.secondary;

  const inner = (
    <View style={styles.inner}>
      {icon ? <Ionicons name={icon} size={16} color={tint} /> : null}
      <Text variant="h3" color={tint}>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        full && styles.full,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'primary' && glow(colors.accent.primary, 'sm'),
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  full: { alignSelf: 'stretch' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  secondary: {
    backgroundColor: alpha(colors.accent.secondary, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.accent.secondary, 0.35),
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
