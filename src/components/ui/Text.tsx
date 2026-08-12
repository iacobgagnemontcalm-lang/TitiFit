import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { colors, typography } from '@/theme';

export type TextVariant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
  /** Applies `textTransform: uppercase` — pairs with the `overline` variant. */
  upper?: boolean;
}

export function Text({
  variant = 'body',
  color = colors.text.primary,
  center,
  upper,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color },
        center && styles.center,
        upper && styles.upper,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  upper: { textTransform: 'uppercase' },
});
