import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TIER_BY_ID } from '@/data/tiers';
import { alpha, colors, glow, radius, spacing, tierGradients } from '@/theme';
import type { CardTier } from '@/types';

import { Text } from './Text';

// ---------------------------------------------------------------------------
// Percentile
// ---------------------------------------------------------------------------

export interface PercentileBadgeProps {
  percentile: number | null;
  color?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function PercentileBadge({
  percentile,
  color = colors.accent.secondary,
  size = 'md',
  style,
}: PercentileBadgeProps) {
  return (
    <View
      style={[
        styles.pill,
        size === 'sm' ? styles.pillSm : null,
        { backgroundColor: alpha(color, 0.16), borderColor: alpha(color, 0.4) },
        style,
      ]}
    >
      <Text variant={size === 'sm' ? 'caption' : 'bodySm'} color={color}>
        {percentile == null ? 'P—' : `P${Math.round(percentile)}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card rarity
// ---------------------------------------------------------------------------

export interface TierBadgeProps {
  tier: CardTier;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function TierBadge({ tier, size = 'md', style }: TierBadgeProps) {
  const gradient = tierGradients[tier];
  const tint = colors.tier[tier];

  return (
    <View style={[styles.tierWrap, glow(tint, size === 'lg' ? 'md' : 'sm'), style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.tier,
          size === 'sm' && styles.tierSm,
          size === 'lg' && styles.tierLg,
        ]}
      >
        <Text
          variant={size === 'lg' ? 'h3' : size === 'sm' ? 'caption' : 'bodySm'}
          color="#0B0713"
          upper
          style={styles.tierText}
        >
          {TIER_BY_ID[tier].name}
        </Text>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Simulated-data disclosure
// ---------------------------------------------------------------------------

export function SimulatedBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sim, style]}>
      <Ionicons name="flask-outline" size={11} color={colors.state.warning} />
      <Text variant="caption" color={colors.state.warning}>
        Benchmarks simulés
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Delta chip (+2.4 / −1.1)
// ---------------------------------------------------------------------------

export function DeltaChip({
  value,
  suffix = '',
  decimals = 1,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  if (!Number.isFinite(value) || value === 0) return null;
  const positive = value > 0;
  const tint = positive ? colors.state.positive : colors.state.negative;

  return (
    <View style={[styles.pill, styles.pillSm, { backgroundColor: alpha(tint, 0.14), borderColor: alpha(tint, 0.35) }]}>
      <Ionicons
        name={positive ? 'trending-up' : 'trending-down'}
        size={11}
        color={tint}
      />
      <Text variant="caption" color={tint}>
        {`${positive ? '+' : ''}${value.toFixed(decimals)}${suffix}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillSm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tierWrap: { alignSelf: 'flex-start', borderRadius: radius.pill },
  tier: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tierSm: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  tierLg: { paddingHorizontal: spacing.lg, paddingVertical: 8 },
  tierText: { letterSpacing: 1.2, fontWeight: '900' },
  sim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.state.warning, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.state.warning, 0.28),
  },
});
