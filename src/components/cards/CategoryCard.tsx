import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { PercentileBadge, ProgressBar, Text } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { alpha, colors, radius, spacing } from '@/theme';
import type { CategoryRating } from '@/types';

export interface CategoryCardProps {
  rating: CategoryRating;
  onPress?: () => void;
  /** Compact rows are used on Home; the full variant on the Categories screen. */
  compact?: boolean;
}

export function CategoryCard({ rating, onPress, compact = false }: CategoryCardProps) {
  const definition = CATEGORIES[rating.categoryId];
  const tint = colors.category[rating.categoryId];
  const value = rating.rating;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        compact && styles.compact,
        { borderColor: alpha(tint, 0.28) },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: alpha(tint, 0.16) }]}>
        <Ionicons
          name={definition.icon as keyof typeof Ionicons.glyphMap}
          size={compact ? 16 : 20}
          color={tint}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant={compact ? 'h3' : 'h2'} color={colors.text.primary}>
            {definition.name}
          </Text>
          <View style={styles.valueRow}>
            {value != null ? (
              <PercentileBadge percentile={rating.percentile} color={tint} size="sm" />
            ) : null}
            <Text variant="stat" color={value == null ? colors.text.faint : tint}>
              {value == null ? '—' : Math.round(value)}
            </Text>
          </View>
        </View>

        <ProgressBar progress={(value ?? 0) / 100} color={tint} height={6} />

        <View style={styles.footer}>
          <Text variant="caption" color={colors.text.faint}>
            {compact ? definition.tagline : definition.description}
          </Text>
          <Text variant="caption" color={rating.isPartial ? colors.state.warning : colors.text.faint}>
            {`${rating.completedTests}/${rating.totalTests}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
    alignItems: 'flex-start',
  },
  compact: { padding: spacing.md },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
