import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, colors, radius, spacing } from '@/theme';

import { Text } from './Text';

export interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = colors.accent.secondary,
  style,
}: StatTileProps) {
  return (
    <View style={[styles.tile, { borderColor: alpha(accent, 0.22) }, style]}>
      <View style={styles.head}>
        {icon ? <Ionicons name={icon} size={13} color={accent} /> : null}
        <Text variant="overline" color={colors.text.faint} upper numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text variant="stat" color={colors.text.primary} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color={colors.text.faint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 96,
    gap: 3,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.cardAlt,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
