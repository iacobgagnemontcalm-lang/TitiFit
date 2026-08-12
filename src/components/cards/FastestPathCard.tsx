import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { TESTS } from '@/data/tests';
import { alpha, colors, radius, spacing } from '@/theme';
import type { FastestPathPlan } from '@/types';

export interface FastestPathCardProps {
  plan: FastestPathPlan;
  limit?: number;
  onPress?: () => void;
}

/**
 * "Voici exactement quoi faire pour passer à 85." Concrete targets beat vague
 * encouragement — each row is a real number the athlete can chase this month.
 */
export function FastestPathCard({ plan, limit = 3, onPress }: FastestPathCardProps) {
  const steps = plan.steps.slice(0, limit);

  return (
    <Card accent={colors.palette.lime} onPress={onPress}>
      <View style={styles.head}>
        <View>
          <Text variant="overline" color={colors.text.faint} upper>
            Fastest path
          </Text>
          <Text variant="h2" color={colors.text.primary}>
            {`Vers ${plan.goalOverall} OVR`}
          </Text>
        </View>
        <View style={styles.currentPill}>
          <Text variant="statSm" color={colors.palette.lime}>
            {plan.currentOverall.toFixed(1)}
          </Text>
        </View>
      </View>

      {steps.length === 0 ? (
        <Text variant="bodySm" color={colors.text.secondary}>
          Enregistre un premier résultat pour que l’app calcule ton chemin le
          plus rapide.
        </Text>
      ) : (
        <View style={styles.list}>
          {steps.map((step) => {
            const test = TESTS[step.testId];
            const tint = colors.category[step.categoryId];
            return (
              <View key={step.testId} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: tint }]} />
                <View style={styles.rowBody}>
                  <Text variant="h3" color={colors.text.primary}>
                    {test.name}
                  </Text>
                  <Text variant="statSm" color={colors.text.secondary}>
                    {step.label}
                  </Text>
                </View>
                <View style={[styles.gain, { borderColor: alpha(colors.palette.lime, 0.35) }]}>
                  <Ionicons name="trending-up" size={12} color={colors.palette.lime} />
                  <Text variant="statSm" color={colors.palette.lime}>
                    {`+${step.overallGain.toFixed(1)}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  currentPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.palette.lime, 0.14),
  },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1, gap: 1 },
  gain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: alpha(colors.palette.lime, 0.1),
  },
});
