import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text variant="overline" color={colors.text.faint} upper>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color={colors.text.secondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
          <Text variant="caption" color={colors.accent.secondary} upper>
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.accent.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  titles: { gap: 2, flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
