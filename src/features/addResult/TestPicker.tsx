import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { PercentileBadge, Text } from '@/components/ui';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { alpha, colors, radius, spacing } from '@/theme';
import type { PersonalRecord, TestDefinition, TestId, UnitPreferences } from '@/types';
import { formatMetric } from '@/utils/format';

export interface TestPickerProps {
  value: TestId | null;
  onChange: (testId: TestId) => void;
  bests: Partial<Record<TestId, PersonalRecord>>;
  units: UnitPreferences;
  /** Shows the secondary tests too. */
  includeSecondary?: boolean;
}

/**
 * Grouped by category, official tests first. The athlete's current best is
 * shown on every row — it turns the picker into "what am I trying to beat".
 */
export function TestPicker({
  value,
  onChange,
  bests,
  units,
  includeSecondary = true,
}: TestPickerProps) {
  return (
    <View style={styles.root}>
      {CATEGORY_ORDER.map((categoryId) => {
        const category = CATEGORIES[categoryId];
        const tests = Object.values(TESTS).filter(
          (t) => t.category === categoryId && (t.official || includeSecondary),
        );
        const tint = colors.category[categoryId];

        return (
          <View key={categoryId} style={styles.group}>
            <View style={styles.groupHead}>
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={13}
                color={tint}
              />
              <Text variant="overline" color={tint} upper>
                {category.name}
              </Text>
            </View>

            <View style={styles.rows}>
              {tests.map((test) => (
                <TestRow
                  key={test.id}
                  test={test}
                  tint={tint}
                  selected={value === test.id}
                  best={bests[test.id]}
                  units={units}
                  onPress={() => onChange(test.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TestRow({
  test,
  tint,
  selected,
  best,
  units,
  onPress,
}: {
  test: TestDefinition;
  tint: string;
  selected: boolean;
  best?: PersonalRecord;
  units: UnitPreferences;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: selected ? alpha(tint, 0.6) : colors.border.subtle,
          backgroundColor: selected ? alpha(tint, 0.12) : colors.bg.card,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowBody}>
        <View style={styles.rowTitle}>
          <Text variant="h3" color={colors.text.primary}>
            {test.name}
          </Text>
          {!test.official ? (
            <View style={styles.secondaryTag}>
              <Text variant="caption" color={colors.text.faint}>
                secondaire
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" color={colors.text.faint} numberOfLines={1}>
          {test.tagline}
        </Text>
      </View>

      {best ? (
        <View style={styles.best}>
          <Text variant="statSm" color={colors.text.secondary}>
            {formatMetric(test, best.metricValue, units)}
          </Text>
          {test.official ? <PercentileBadge percentile={best.percentile} color={tint} size="sm" /> : null}
        </View>
      ) : (
        <Text variant="caption" color={colors.text.faint}>
          jamais testé
        </Text>
      )}

      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={18}
        color={selected ? tint : colors.text.faint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rows: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pressed: { opacity: 0.75 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  secondaryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.input,
  },
  best: { alignItems: 'flex-end', gap: 3 },
});
