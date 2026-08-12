import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { PercentileBadge, RatingCircle, Text, TierBadge } from '@/components/ui';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { alpha, colors, glow, radius, spacing } from '@/theme';
import type { AthleteTypeId, CardTier } from '@/types';

export interface OverallHeroProps {
  overall: number | null;
  percentile: number | null;
  tier: CardTier;
  athleteType: AthleteTypeId;
  isProvisional: boolean;
  completedTests: number;
  totalTests: number;
}

/**
 * The number the whole app exists to produce. Deliberately the largest thing
 * on Home — everything else on the screen explains or moves this figure.
 */
export function OverallHero({
  overall,
  percentile,
  tier,
  athleteType,
  isProvisional,
  completedTests,
  totalTests,
}: OverallHeroProps) {
  const type = ATHLETE_TYPE_BY_ID[athleteType];
  const tint = colors.tier[tier];

  return (
    <View style={styles.root}>
      <View style={[styles.ringWrap, glow(tint, 'lg')]}>
        <RatingCircle
          rating={overall}
          size={188}
          strokeWidth={12}
          color={tint}
          gradientTo={colors.accent.primary}
          label="Overall"
        />
      </View>

      <View style={styles.meta}>
        <TierBadge tier={tier} size="lg" />
        <PercentileBadge percentile={percentile} color={colors.accent.secondary} />
      </View>

      <View style={[styles.typeChip, { borderColor: alpha(colors.accent.primary, 0.35) }]}>
        <Ionicons
          name={type.icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={colors.accent.primary}
        />
        <Text variant="h3" color={colors.text.primary}>
          {type.name}
        </Text>
      </View>

      <Text variant="bodySm" color={colors.text.secondary} center style={styles.desc}>
        {type.description}
      </Text>

      {isProvisional ? (
        <View style={styles.provisional}>
          <Ionicons name="alert-circle-outline" size={12} color={colors.state.warning} />
          <Text variant="caption" color={colors.state.warning}>
            {`Overall provisoire — ${completedTests}/${totalTests} tests officiels complétés`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md },
  ringWrap: { borderRadius: 999 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: alpha(colors.accent.primary, 0.1),
  },
  desc: { paddingHorizontal: spacing.lg, maxWidth: 340 },
  provisional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.state.warning, 0.1),
  },
});
