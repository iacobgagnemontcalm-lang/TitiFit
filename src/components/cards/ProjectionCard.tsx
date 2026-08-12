import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { alpha, colors, spacing } from '@/theme';
import type { JourneyPoint, ProjectedRating } from '@/types';
import { formatMonthYear } from '@/utils/date';

const CONFIDENCE_LABEL: Record<ProjectedRating['confidence'], string> = {
  low: 'confiance faible',
  medium: 'confiance moyenne',
  high: 'confiance élevée',
};

export function ProjectionCard({
  projection,
  journey,
}: {
  projection: ProjectedRating;
  journey: JourneyPoint[];
}) {
  const recent = journey.slice(-3);
  const tint = colors.accent.secondary;

  return (
    <Card accent={tint}>
      <View style={styles.head}>
        <View>
          <Text variant="overline" color={colors.text.faint} upper>
            Projected rating
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            {`Dans ${projection.weeks} semaines`}
          </Text>
        </View>
        <View style={styles.numbers}>
          <Text variant="h1" color={colors.text.primary}>
            {projection.current}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text.faint} />
          <Text variant="h1" color={tint}>
            {projection.projected}
          </Text>
        </View>
      </View>

      {recent.length > 1 ? (
        <View style={styles.timeline}>
          {recent.map((point) => (
            <View key={point.month} style={styles.point}>
              <Text variant="caption" color={colors.text.faint} upper>
                {formatMonthYear(point.month)}
              </Text>
              <Text variant="statSm" color={colors.text.primary}>
                {`${point.overall} OVR`}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.note, { borderColor: alpha(colors.state.warning, 0.25) }]}>
        <Ionicons name="information-circle-outline" size={12} color={colors.state.warning} />
        <Text variant="caption" color={colors.text.faint}>
          {`Projection basée sur ta progression récente (${CONFIDENCE_LABEL[projection.confidence]}). Ce n’est pas une garantie.`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  numbers: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  point: { gap: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
