import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ProjectionCard, XPCard } from '@/components/cards';
import { Sparkline } from '@/components/charts/Sparkline';
import {
  Card,
  ProgressBar,
  Screen,
  SectionHeader,
  StatTile,
  Text,
} from '@/components/ui';
import { TIER_BY_ID } from '@/data/tiers';
import { useAthlete } from '@/hooks/useAthlete';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { AchievementCategory, AchievementProgress } from '@/types';
import { formatMonthYear, formatRelative, parseISODate } from '@/utils/date';
import { formatXP } from '@/utils/format';

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all: 'Tous',
  strength: 'Force',
  bodyweight: 'Bodyweight',
  hybrid: 'Hybrid',
  speed: 'Speed',
  endurance: 'Endurance',
  consistency: 'Constance',
  fun: 'Fun',
};

const TIER_COLOR: Record<string, string> = {
  bronze: colors.tier.bronze,
  silver: colors.tier.silver,
  gold: colors.tier.gold,
  platinum: colors.tier.platinum,
};

export function ProgressionScreen() {
  const router = useRouter();
  const { state } = useAthlete();
  const xpTransactions = useAthleteStore((s) => s.xpTransactions);
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');

  const recentXP = useMemo(
    () => [...xpTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [xpTransactions],
  );

  if (!state) return null;

  const { level, achievements, journey, projection, career } = state;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const filtered = achievements.filter(
    (a) => filter === 'all' || a.achievement.category === filter,
  );
  // Unlocked first, then whatever is closest to unlocking.
  const sorted = [...filtered].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return b.progress - a.progress;
  });

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        <Text variant="bodySm" color={colors.text.secondary}>
          Retour
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text variant="h1" color={colors.text.primary}>
          Progression
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          {`Niveau ${level.level} · ${formatXP(level.totalXP)} XP au total`}
        </Text>
      </View>

      <XPCard level={level} />

      <View style={styles.tiles}>
        <StatTile
          label="Badges"
          value={`${unlockedCount}/${achievements.length}`}
          icon="trophy"
          accent={colors.palette.amber}
        />
        <StatTile label="Records" value={`${career.totalPRs}`} icon="flame" accent={colors.palette.orange} />
        <StatTile
          label="Jours"
          value={`${career.activeDays}`}
          hint="actifs"
          icon="calendar"
          accent={colors.state.positive}
        />
      </View>

      {/* --- Athlete Journey ---------------------------------------------- */}
      {journey.length > 1 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Athlete Journey"
            subtitle={`${journey[0]!.overall} → ${journey[journey.length - 1]!.overall} OVR`}
          />
          <Card accent={colors.accent.primary}>
            <Sparkline
              points={journey.map((j) => ({
                x: parseISODate(`${j.month}-01`).getTime(),
                y: j.overall,
              }))}
              color={colors.accent.primary}
              height={96}
            />
            <View style={styles.journeyList}>
              {journey.map((point) => (
                <View key={point.month} style={styles.journeyRow}>
                  <View
                    style={[styles.journeyDot, { backgroundColor: colors.tier[point.tier] }]}
                  />
                  <Text variant="bodySm" color={colors.text.secondary} style={styles.flex}>
                    {formatMonthYear(point.month)}
                  </Text>
                  <Text variant="caption" color={colors.tier[point.tier]} upper>
                    {TIER_BY_ID[point.tier].name}
                  </Text>
                  <Text variant="stat" color={colors.text.primary}>
                    {point.overall}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {projection ? (
        <View style={styles.section}>
          <ProjectionCard projection={projection} journey={journey} />
        </View>
      ) : null}

      {/* --- Achievements -------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Achievements" subtitle={`${unlockedCount} débloqués`} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {(Object.keys(CATEGORY_LABELS) as (AchievementCategory | 'all')[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[
                styles.chip,
                {
                  borderColor:
                    filter === key ? alpha(colors.accent.secondary, 0.6) : colors.border.default,
                  backgroundColor:
                    filter === key ? alpha(colors.accent.secondary, 0.16) : 'transparent',
                },
              ]}
            >
              <Text
                variant="bodySm"
                color={filter === key ? colors.accent.secondary : colors.text.secondary}
              >
                {CATEGORY_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.achievements}>
          {sorted.map((item) => (
            <AchievementRow key={item.achievement.id} item={item} />
          ))}
        </View>
      </View>

      {/* --- XP history ---------------------------------------------------- */}
      {recentXP.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="XP récent" />
          <Card padded={false} style={styles.xpCard}>
            {recentXP.map((tx) => (
              <View key={tx.id} style={styles.xpRow}>
                <View style={styles.flex}>
                  <Text variant="bodySm" color={colors.text.primary}>
                    {tx.label}
                  </Text>
                  <Text variant="caption" color={colors.text.faint}>
                    {formatRelative(tx.date)}
                  </Text>
                </View>
                <Text variant="statSm" color={colors.accent.primary}>
                  {`+${tx.amount}`}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function AchievementRow({ item }: { item: AchievementProgress }) {
  const { achievement, unlocked, progress, progressLabel } = item;
  const tint = TIER_COLOR[achievement.tier] ?? colors.accent.secondary;

  return (
    <View
      style={[
        styles.achievement,
        {
          borderColor: unlocked ? alpha(tint, 0.45) : colors.border.subtle,
          backgroundColor: unlocked ? alpha(tint, 0.08) : colors.bg.card,
        },
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          { backgroundColor: unlocked ? alpha(tint, 0.18) : colors.bg.input },
        ]}
      >
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={17}
          color={unlocked ? tint : colors.text.faint}
        />
      </View>

      <View style={styles.flex}>
        <View style={styles.achievementTitle}>
          <Text
            variant="h3"
            color={unlocked ? colors.text.primary : colors.text.secondary}
            numberOfLines={1}
          >
            {achievement.name}
          </Text>
          {unlocked ? <Ionicons name="checkmark-circle" size={14} color={tint} /> : null}
        </View>
        <Text variant="caption" color={colors.text.faint} numberOfLines={2}>
          {achievement.description}
        </Text>

        {!unlocked ? (
          <>
            <ProgressBar progress={progress} color={tint} height={4} style={styles.achievementBar} />
            {progressLabel ? (
              <Text variant="caption" color={colors.text.faint}>
                {progressLabel}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>

      <Text variant="statSm" color={unlocked ? tint : colors.text.faint}>
        {`+${achievement.xp}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: 2, marginTop: spacing.md, marginBottom: spacing.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  section: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  journeyList: { gap: spacing.sm, marginTop: spacing.lg },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  journeyDot: { width: 8, height: 8, borderRadius: 4 },
  filters: { gap: spacing.sm, paddingBottom: spacing.md, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  achievements: { gap: spacing.sm },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  achievementIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  achievementBar: { marginTop: 6, marginBottom: 3 },
  xpCard: { paddingVertical: spacing.xs },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
