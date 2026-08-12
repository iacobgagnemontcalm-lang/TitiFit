import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card, ProgressBar, Text } from '@/components/ui';
import { colors, gradients, spacing } from '@/theme';
import type { LevelState } from '@/types';
import { formatXP } from '@/utils/format';

export function XPCard({ level, onPress }: { level: LevelState; onPress?: () => void }) {
  const remaining = level.xpForLevel - level.xpIntoLevel;

  return (
    <Card accent={colors.accent.primary} onPress={onPress}>
      <View style={styles.head}>
        <View style={styles.levelRow}>
          <Ionicons name="sparkles" size={15} color={colors.accent.primary} />
          <Text variant="overline" color={colors.text.faint} upper>
            Niveau
          </Text>
          <Text variant="h2" color={colors.text.primary}>
            {level.level}
          </Text>
        </View>
        <Text variant="statSm" color={colors.text.secondary}>
          {`${formatXP(level.xpIntoLevel)} / ${formatXP(level.xpForLevel)} XP`}
        </Text>
      </View>

      <ProgressBar
        progress={level.progress}
        gradient={gradients.primary}
        color={colors.accent.primary}
        height={10}
        style={styles.bar}
      />

      <Text variant="caption" color={colors.text.faint}>
        {`Encore ${formatXP(remaining)} XP avant le niveau ${level.level + 1}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { marginVertical: spacing.md },
});
