import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { PercentileBadge, Text } from '@/components/ui';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TIER_BY_ID } from '@/data/tiers';
import { alpha, colors, glow, radius, spacing, tierGradients } from '@/theme';
import type { Achievement, AthleteTypeId, CardTier, CategoryRating, CategoryId } from '@/types';
import { formatXP } from '@/utils/format';

export interface AthleteCardProps {
  displayName: string;
  username: string;
  avatarUri?: string;
  overall: number | null;
  percentile: number | null;
  tier: CardTier;
  athleteType: AthleteTypeId;
  level: number;
  totalXP: number;
  categories: Record<CategoryId, CategoryRating>;
  bestAchievement?: Achievement;
  /** Compact variant for lists and the VS screen. */
  compact?: boolean;
}

/**
 * THE ATHLETE CARD.
 *
 * The visual identity of the whole product: a sports-game player card, but
 * with its own language — the rarity tier owns the frame and the glow, the
 * five categories read like a stat block, and the archetype is the "position".
 */
export function AthleteCard({
  displayName,
  username,
  avatarUri,
  overall,
  percentile,
  tier,
  athleteType,
  level,
  totalXP,
  categories,
  bestAchievement,
  compact = false,
}: AthleteCardProps) {
  const tint = colors.tier[tier];
  const type = ATHLETE_TYPE_BY_ID[athleteType];

  return (
    <View style={[styles.frame, glow(tint, compact ? 'sm' : 'lg')]}>
      <LinearGradient
        colors={tierGradients[tier]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        <LinearGradient
          colors={['#15142E', '#0B0A1C']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Diagonal sheen — what makes it read as a "card" and not a panel. */}
        <LinearGradient
          colors={[alpha(tint, 0.22), 'transparent', alpha(tint, 0.1)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* --- Header: rating + identity ------------------------------- */}
        <View style={styles.header}>
          <View style={styles.ratingBlock}>
            <Text
              variant={compact ? 'h1' : 'display'}
              color={colors.text.primary}
              style={styles.ovr}
            >
              {overall ?? '—'}
            </Text>
            <Text variant="overline" color={tint} upper>
              OVR
            </Text>
            <View style={[styles.tierPill, { backgroundColor: alpha(tint, 0.2), borderColor: alpha(tint, 0.5) }]}>
              <Text variant="caption" color={tint} upper style={styles.tierText}>
                {TIER_BY_ID[tier].name}
              </Text>
            </View>
          </View>

          <View style={[styles.avatar, { borderColor: alpha(tint, 0.55) }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text variant="h1" color={alpha(tint, 0.75)}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.identity}>
          <Text variant={compact ? 'h3' : 'h2'} color={colors.text.primary} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.identityMeta}>
            <Text variant="caption" color={colors.text.faint}>
              {`@${username}`}
            </Text>
            <PercentileBadge percentile={percentile} color={tint} size="sm" />
          </View>
        </View>

        {/* --- Archetype ------------------------------------------------- */}
        <View style={[styles.typeRow, { borderColor: alpha(tint, 0.3) }]}>
          <Ionicons
            name={type.icon as keyof typeof Ionicons.glyphMap}
            size={13}
            color={tint}
          />
          <Text variant="bodySm" color={colors.text.primary}>
            {type.name}
          </Text>
        </View>

        {/* --- Stat block ------------------------------------------------ */}
        <View style={styles.stats}>
          {CATEGORY_ORDER.map((id) => {
            const rating = categories[id]?.rating;
            return (
              <View key={id} style={styles.stat}>
                <Text variant="overline" color={colors.text.faint} upper numberOfLines={1}>
                  {CATEGORIES[id].name.slice(0, 3)}
                </Text>
                <Text
                  variant="stat"
                  color={rating == null ? colors.text.faint : colors.category[id]}
                >
                  {rating == null ? '—' : Math.round(rating)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* --- Footer: level, XP, best achievement ----------------------- */}
        <View style={[styles.footer, { borderTopColor: alpha(tint, 0.22) }]}>
          <View style={styles.footerCell}>
            <Text variant="overline" color={colors.text.faint} upper>
              Niveau
            </Text>
            <Text variant="statSm" color={colors.text.primary}>
              {`${level}`}
            </Text>
          </View>
          <View style={styles.footerCell}>
            <Text variant="overline" color={colors.text.faint} upper>
              XP
            </Text>
            <Text variant="statSm" color={colors.text.primary}>
              {formatXP(totalXP)}
            </Text>
          </View>
          <View style={[styles.footerCell, styles.footerWide]}>
            <Text variant="overline" color={colors.text.faint} upper>
              Meilleur badge
            </Text>
            <Text variant="statSm" color={colors.text.primary} numberOfLines={1}>
              {bestAchievement?.name ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.xxl, padding: 2, overflow: 'hidden' },
  inner: {
    borderRadius: radius.xxl - 2,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ratingBlock: { gap: 2 },
  ovr: { letterSpacing: -3 },
  tierPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tierText: { letterSpacing: 1.2, fontWeight: '900' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  identity: { gap: 3 },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stat: { alignItems: 'center', gap: 1, flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerCell: { gap: 1 },
  footerWide: { flex: 1 },
});
