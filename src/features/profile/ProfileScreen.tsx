import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AthleteCard } from '@/components/cards/AthleteCard';
import {
  Button,
  Card,
  PercentileBadge,
  Screen,
  SectionHeader,
  SimulatedBadge,
  StatTile,
  Text,
} from '@/components/ui';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { TIER_BY_ID, TIERS } from '@/data/tiers';
import { useAthlete } from '@/hooks/useAthlete';
import { bestAchievement } from '@/services/achievementEngine';
import { nextTierThreshold } from '@/services/ratingEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing } from '@/theme';
import { formatMetric } from '@/utils/format';
import { formatShortDate } from '@/utils/date';

export function ProfileScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();
  const unlocked = useAthleteStore((s) => s.unlockedAchievements);
  const showSimulated = useAthleteStore((s) => s.settings.showSimulatedBadges);

  if (!user || !state) return null;

  const { overall, level, career } = state;
  const best = bestAchievement(unlocked);
  const nextTier = overall.value != null ? nextTierThreshold(overall.value) : null;

  const share = () => {
    const lines = [
      `${user.displayName} — ${overall.value ?? '—'} OVR (${TIER_BY_ID[overall.tier].name})`,
      overall.percentile != null ? `Percentile global : P${Math.round(overall.percentile)}` : null,
      CATEGORY_ORDER.map(
        (id) =>
          `${CATEGORIES[id].name} ${overall.categories[id].rating != null ? Math.round(overall.categories[id].rating!) : '—'}`,
      ).join(' · '),
      `Niveau ${level.level} · ${career.totalPRs} records personnels`,
      'TitiFit — Découvre quel athlète tu es.',
    ].filter(Boolean);

    Share.share({ message: lines.join('\n') }).catch(() => undefined);
  };

  return (
    <Screen hero>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="h1" color={colors.text.primary}>
            Ma carte
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            {`${state.completedTests}/${state.totalTests} tests officiels complétés`}
          </Text>
        </View>
        <Pressable onPress={share} hitSlop={12} style={styles.iconButton}>
          <Ionicons name="share-outline" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <AthleteCard
        displayName={user.displayName}
        username={user.username}
        avatarUri={user.avatarUri}
        overall={overall.value}
        percentile={overall.percentile}
        tier={overall.tier}
        athleteType={overall.athleteType}
        level={level.level}
        totalXP={level.totalXP}
        categories={overall.categories}
        bestAchievement={best}
      />

      {showSimulated ? <SimulatedBadge style={styles.sim} /> : null}

      <Button
        label="Partager ma carte"
        icon="share-social-outline"
        variant="secondary"
        onPress={share}
        style={styles.shareButton}
      />

      {/* --- Rarity ladder --------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader
          title="Rareté"
          subtitle={
            nextTier
              ? `${nextTier.at - (overall.value ?? 0)} point${nextTier.at - (overall.value ?? 0) > 1 ? 's' : ''} d’Overall avant ${TIER_BY_ID[nextTier.tier].name}`
              : 'Palier maximal atteint'
          }
        />
        <View style={styles.ladder}>
          {TIERS.map((t) => {
            const reached = (overall.value ?? -1) >= t.min;
            const current = t.id === overall.tier;
            return (
              <View
                key={t.id}
                style={[
                  styles.rung,
                  {
                    borderColor: current
                      ? alpha(colors.tier[t.id], 0.7)
                      : reached
                        ? alpha(colors.tier[t.id], 0.3)
                        : colors.border.subtle,
                    backgroundColor: current ? alpha(colors.tier[t.id], 0.14) : 'transparent',
                  },
                ]}
              >
                <View style={[styles.rungDot, { backgroundColor: reached ? colors.tier[t.id] : colors.bg.input }]} />
                <Text
                  variant="bodySm"
                  color={reached ? colors.text.primary : colors.text.faint}
                  style={styles.flex}
                >
                  {t.name}
                </Text>
                <Text variant="statSm" color={colors.text.faint}>
                  {`${t.min}–${t.max}`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* --- Career ------------------------------------------------------ */}
      <View style={styles.section}>
        <SectionHeader title="Carrière" actionLabel="Progression" onAction={() => router.push('/progression')} />
        <View style={styles.tiles}>
          <StatTile label="Meilleur OVR" value={`${career.bestOverall ?? '—'}`} icon="trophy" accent={colors.palette.amber} />
          <StatTile
            label="Évolution"
            value={career.overallGain != null ? `${career.overallGain >= 0 ? '+' : ''}${career.overallGain}` : '—'}
            hint="depuis le début"
            icon="trending-up"
            accent={colors.state.positive}
          />
          <StatTile label="Records" value={`${career.totalPRs}`} icon="flame" accent={colors.palette.orange} />
        </View>
        <View style={[styles.tiles, styles.tilesSpaced]}>
          <StatTile label="Résultats" value={`${career.totalResults}`} icon="list" />
          <StatTile label="Jours" value={`${career.activeDays}`} hint="actifs" icon="calendar" />
          <StatTile label="Série record" value={`${state.streak.longest} sem`} icon="flame" accent={colors.palette.orange} />
        </View>
      </View>

      {/* --- Personal records -------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Records officiels" actionLabel="Catégories" onAction={() => router.push('/categories')} />
        <Card padded={false} style={styles.records}>
          {CATEGORY_ORDER.flatMap((categoryId) =>
            CATEGORIES[categoryId].officialTests.map((testId) => {
              const record = state.bests[testId];
              const test = TESTS[testId];
              const tint = colors.category[categoryId];
              return (
                <Pressable
                  key={testId}
                  onPress={() => router.push(`/test/${testId}`)}
                  style={({ pressed }) => [styles.recordRow, pressed && styles.pressed]}
                >
                  <View style={[styles.recordDot, { backgroundColor: tint }]} />
                  <View style={styles.flex}>
                    <Text variant="bodySm" color={colors.text.primary}>
                      {test.name}
                    </Text>
                    <Text variant="caption" color={colors.text.faint}>
                      {record ? formatShortDate(record.date) : 'jamais testé'}
                    </Text>
                  </View>
                  <Text variant="statSm" color={record ? colors.text.primary : colors.text.faint}>
                    {record ? formatMetric(test, record.metricValue, user.units) : '—'}
                  </Text>
                  {record ? <PercentileBadge percentile={record.percentile} color={tint} size="sm" /> : null}
                  <Ionicons name="chevron-forward" size={14} color={colors.text.faint} />
                </Pressable>
              );
            }),
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerText: { gap: 2, flex: 1 },
  iconButton: { padding: spacing.xs },
  sim: { alignSelf: 'center', marginTop: spacing.md },
  shareButton: { marginTop: spacing.lg },
  section: { marginTop: spacing.xxl },
  flex: { flex: 1 },
  ladder: { gap: spacing.xs },
  rung: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rungDot: { width: 8, height: 8, borderRadius: 4 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tilesSpaced: { marginTop: spacing.sm },
  records: { paddingVertical: spacing.xs },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  recordDot: { width: 6, height: 6, borderRadius: 3 },
  pressed: { opacity: 0.7 },
});
