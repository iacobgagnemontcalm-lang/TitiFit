import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, ProgressBar, Text } from '@/components/ui';
import { goalLabel } from '@/services/challengeEngine';
import { alpha, colors, radius, spacing } from '@/theme';
import type { ChallengeProgress } from '@/types';

export function ChallengeCard({
  progress,
  onPress,
}: {
  progress: ChallengeProgress;
  onPress?: () => void;
}) {
  const { challenge } = progress;
  const tint = challenge.accent;

  return (
    <Card accent={tint} onPress={onPress}>
      <View style={styles.head}>
        <View style={styles.titles}>
          <Text variant="overline" color={tint} upper>
            {challenge.scope === 'monthly'
              ? 'Défi du mois'
              : challenge.scope === 'weekly'
                ? 'Défi de la semaine'
                : challenge.scope === 'daily'
                  ? 'Défi du jour'
                  : 'Défi communautaire'}
          </Text>
          <Text variant="h2" color={colors.text.primary}>
            {challenge.name}
          </Text>
        </View>
        <Text variant="stat" color={tint}>
          {`${Math.round(progress.progress * 100)}%`}
        </Text>
      </View>

      <ProgressBar progress={progress.progress} color={tint} height={8} style={styles.bar} />

      <View style={styles.goals}>
        {challenge.goals.map((goal, i) => (
          <View key={`${goal.kind}-${i}`} style={styles.goal}>
            <Ionicons
              name={(progress.goalProgress[i] ?? 0) >= 1 ? 'checkmark-circle' : 'ellipse-outline'}
              size={13}
              color={(progress.goalProgress[i] ?? 0) >= 1 ? colors.state.positive : colors.text.faint}
            />
            <Text variant="bodySm" color={colors.text.secondary}>
              {goalLabel(goal)}
            </Text>
            <Text variant="caption" color={colors.text.faint}>
              {`${Math.round((progress.goalProgress[i] ?? 0) * 100)}%`}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.reward, { borderColor: alpha(tint, 0.3) }]}>
        <Ionicons name="gift-outline" size={13} color={tint} />
        <Text variant="caption" color={colors.text.secondary}>
          {`+${challenge.xpReward} XP${challenge.badgeId ? ' · badge exclusif' : ''}`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  titles: { flex: 1, gap: 2 },
  bar: { marginVertical: spacing.md },
  goals: { gap: spacing.sm },
  goal: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderRadius: 0,
  },
});
