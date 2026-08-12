import { StyleSheet, View } from 'react-native';

import { DeltaChip, PercentileBadge, Text } from '@/components/ui';
import { TESTS } from '@/data/tests';
import { alpha, colors, radius, spacing } from '@/theme';
import type { PersonalRecord, UnitPreferences } from '@/types';
import { formatMetric } from '@/utils/format';
import { formatRelative } from '@/utils/date';

export interface PRCardProps {
  record: PersonalRecord;
  units: UnitPreferences;
  percentileDelta?: number;
}

export function PRCard({ record, units, percentileDelta }: PRCardProps) {
  const test = TESTS[record.testId];
  const tint = colors.category[test.category];

  return (
    <View style={[styles.root, { borderColor: alpha(tint, 0.35) }]}>
      <View style={styles.head}>
        <Text variant="overline" color={colors.palette.orange} upper>
          🔥 Nouveau PR
        </Text>
        <Text variant="caption" color={colors.text.faint}>
          {formatRelative(record.date)}
        </Text>
      </View>

      <Text variant="h1" color={colors.text.primary}>
        {formatMetric(test, record.metricValue, units)}
      </Text>
      <Text variant="bodySm" color={colors.text.secondary}>
        {test.name}
      </Text>

      <View style={styles.footer}>
        <PercentileBadge percentile={record.percentile} color={tint} size="sm" />
        <Text variant="statSm" color={tint}>
          {`${Math.round(record.rating)} rating`}
        </Text>
        {percentileDelta ? <DeltaChip value={percentileDelta} suffix=" pct" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 3,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
