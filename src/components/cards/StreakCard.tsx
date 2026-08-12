import { StyleSheet, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { streakMessage } from '@/services/streakEngine';
import { alpha, colors, radius, spacing } from '@/theme';
import type { StreakState } from '@/types';
import { clamp } from '@/utils/math';

export function StreakCard({ streak }: { streak: StreakState }) {
  const tint = streak.weekSecured ? colors.palette.orange : colors.text.faint;
  const target = streak.activitiesThisWeek + streak.activitiesNeeded;

  return (
    <View style={[styles.root, { borderColor: alpha(tint, 0.3) }]}>
      <View style={styles.head}>
        <Text variant="h2" color={colors.text.primary}>
          {`🔥 ${streak.current}`}
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          {streak.current === 1 ? 'semaine active' : 'semaines actives'}
        </Text>
        <View style={styles.spacer} />
        <Text variant="caption" color={colors.text.faint} upper>
          {`Record ${streak.longest}`}
        </Text>
      </View>

      <ProgressBar
        progress={clamp(streak.activitiesThisWeek / Math.max(1, target), 0, 1)}
        color={colors.palette.orange}
        height={6}
      />

      <Text variant="caption" color={streak.weekSecured ? colors.state.positive : colors.text.secondary}>
        {streakMessage(streak)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  spacer: { flex: 1 },
});
