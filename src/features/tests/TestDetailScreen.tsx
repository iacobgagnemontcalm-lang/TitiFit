import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sparkline } from '@/components/charts/Sparkline';
import {
  Button,
  Card,
  DeltaChip,
  PercentileBadge,
  RatingCircle,
  Screen,
  SectionHeader,
  SimulatedBadge,
  StatTile,
  Text,
} from '@/components/ui';
import { getValueForRating } from '@/benchmarkEngine';
import { CATEGORIES } from '@/data/categories';
import { TESTS, TEST_DISTANCE_METRES, isOfficialTest } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { calculateTestRating } from '@/services/ratingEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { OfficialTestId, TestId } from '@/types';
import { formatShortDate, parseISODate } from '@/utils/date';
import { formatMetric } from '@/utils/format';
import { formatPace, formatSpeed, formatWeight } from '@/utils/units';

/** Rating milestones offered as "next targets". */
const TARGET_STEPS = [10, 25, 50, 75, 90, 95, 99];

export function TestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: TestId }>();
  const { user, state } = useAthlete();
  const results = useAthleteStore((s) => s.results);
  const showSimulated = useAthleteStore((s) => s.settings.showSimulatedBadges);

  const test = id ? TESTS[id] : undefined;

  const history = useMemo(() => {
    if (!test || !state) return [];
    return results
      .filter((r) => r.testId === test.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const scored = isOfficialTest(r.testId)
          ? calculateTestRating(r.testId, r.metricValue, {
              ...state.subject,
              bodyWeightKg: r.bodyWeightKg,
            })
          : null;
        return { ...r, rating: scored?.rating ?? null, percentile: scored?.percentile ?? null };
      });
  }, [results, test, state]);

  if (!test || !user || !state) return null;

  const record = state.bests[test.id];
  const tint = colors.category[test.category];
  const official = isOfficialTest(test.id);
  const distance = TEST_DISTANCE_METRES[test.id];

  // Next reachable rating milestone above the current one.
  const currentRating = record?.rating ?? 0;
  const nextTargets = official
    ? TARGET_STEPS.filter((t) => t > currentRating)
        .slice(0, 3)
        .map((targetRating) => ({
          targetRating,
          value: getValueForRating({
            testId: test.id as OfficialTestId,
            sex: state.subject.sex,
            age: state.subject.age,
            bodyWeightKg: state.subject.bodyWeightKg,
            targetRating,
          }),
        }))
        .filter((t): t is { targetRating: number; value: number } => t.value != null)
    : [];

  const first = history[0];
  const latest = history[history.length - 1];
  const progressDelta =
    first && latest && first.percentile != null && latest.percentile != null && history.length > 1
      ? Math.round((latest.percentile - first.percentile) * 10) / 10
      : 0;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        <Text variant="bodySm" color={colors.text.secondary}>
          Retour
        </Text>
      </Pressable>

      {/* --- Hero -------------------------------------------------------- */}
      <View style={styles.hero}>
        <Text variant="overline" color={tint} upper>
          {CATEGORIES[test.category].name}
          {official ? ' · test officiel' : ' · statistique secondaire'}
        </Text>
        <Text variant="h1" color={colors.text.primary} center>
          {test.name}
        </Text>
        <Text variant="bodySm" color={colors.text.secondary} center style={styles.tagline}>
          {test.tagline}
        </Text>

        {record ? (
          <>
            <Text variant="display" color={colors.text.primary} style={styles.value}>
              {formatMetric(test, record.metricValue, user.units)}
            </Text>
            {official ? (
              <View style={styles.heroMeta}>
                <PercentileBadge percentile={record.percentile} color={tint} />
                <RatingCircle
                  rating={record.rating}
                  size={64}
                  strokeWidth={6}
                  color={tint}
                  valueVariant="h3"
                />
              </View>
            ) : null}
            <Text variant="caption" color={colors.text.faint}>
              {`Record établi le ${formatShortDate(record.date)}`}
            </Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="add-circle-outline" size={28} color={colors.text.faint} />
            <Text variant="body" color={colors.text.secondary} center>
              Tu n’as pas encore complété ce test.
            </Text>
          </View>
        )}
      </View>

      {/* --- Derived stats ------------------------------------------------ */}
      {record ? (
        <View style={styles.tiles}>
          {test.normalization === 'bodyweight_ratio' ? (
            <>
              <StatTile
                label="Ratio"
                value={`${(record.metricValue / Math.max(1, user.bodyWeightKg)).toFixed(2)}×`}
                hint="poids de corps"
                icon="barbell"
                accent={tint}
              />
              <StatTile
                label="Poids de corps"
                value={formatWeight(user.bodyWeightKg, user.units.weight)}
                icon="body"
                accent={tint}
              />
            </>
          ) : null}
          {distance && test.unit === 'seconds' ? (
            <>
              <StatTile
                label="Allure"
                value={formatPace(record.metricValue, distance, user.units.distance)}
                icon="speedometer"
                accent={tint}
              />
              <StatTile
                label="Vitesse"
                value={formatSpeed(record.metricValue, distance).replace(' km/h', '')}
                hint="km/h"
                icon="flash"
                accent={tint}
              />
            </>
          ) : null}
          <StatTile label="Tentatives" value={`${history.length}`} icon="repeat" accent={tint} />
        </View>
      ) : null}

      {/* --- Standard ----------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Standard d’exécution" subtitle="À respecter pour que le score soit comparable" />
        <Card accent={tint}>
          {test.standard.map((line) => (
            <View key={line} style={styles.standardRow}>
              <Ionicons name="checkmark-circle" size={14} color={tint} />
              <Text variant="bodySm" color={colors.text.secondary} style={styles.flex}>
                {line}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      {/* --- Progression -------------------------------------------------- */}
      {history.length > 1 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Progression"
            subtitle={`${history.length} tentatives enregistrées`}
          />
          <Card accent={tint}>
            <View style={styles.chartHead}>
              <Text variant="statSm" color={colors.text.secondary}>
                {formatMetric(test, first?.metricValue ?? 0, user.units)}
              </Text>
              {progressDelta ? <DeltaChip value={progressDelta} suffix=" pct" /> : null}
              <View style={styles.flex} />
              <Text variant="statSm" color={tint}>
                {formatMetric(test, latest?.metricValue ?? 0, user.units)}
              </Text>
            </View>
            <Sparkline
              points={history.map((h) => ({
                x: parseISODate(h.date).getTime(),
                y: h.metricValue,
              }))}
              color={tint}
              lowerIsBetter={test.direction === 'lower_is_better'}
              height={92}
            />
          </Card>
        </View>
      ) : null}

      {/* --- Next targets -------------------------------------------------- */}
      {nextTargets.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Prochains paliers"
            subtitle="Ce qu’il faudrait réaliser pour atteindre chaque rating"
          />
          <View style={styles.targets}>
            {nextTargets.map((target) => (
              <View
                key={target.targetRating}
                style={[styles.target, { borderColor: alpha(tint, 0.3) }]}
              >
                <View style={[styles.targetBadge, { backgroundColor: alpha(tint, 0.16) }]}>
                  <Text variant="statSm" color={tint}>
                    {target.targetRating}
                  </Text>
                </View>
                <Text variant="stat" color={colors.text.primary} style={styles.flex}>
                  {formatMetric(test, target.value, user.units)}
                </Text>
                <Text variant="caption" color={colors.text.faint}>
                  {`P${target.targetRating}`}
                </Text>
              </View>
            ))}
          </View>
          {showSimulated ? <SimulatedBadge style={styles.sim} /> : null}
        </View>
      ) : null}

      {/* --- History list -------------------------------------------------- */}
      {history.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Historique" />
          <Card padded={false} style={styles.historyCard}>
            {[...history].reverse().map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View style={styles.flex}>
                  <Text variant="bodySm" color={colors.text.primary}>
                    {formatMetric(test, entry.metricValue, user.units)}
                    {entry.estimated ? ' (est.)' : ''}
                  </Text>
                  <Text variant="caption" color={colors.text.faint}>
                    {[
                      formatShortDate(entry.date),
                      entry.rpe ? `RPE ${entry.rpe}` : null,
                      entry.raw.reps && entry.raw.reps > 1
                        ? `${Math.round(entry.raw.weightKg ?? 0)} kg × ${entry.raw.reps}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                {entry.percentile != null ? (
                  <PercentileBadge percentile={entry.percentile} color={tint} size="sm" />
                ) : null}
                {record?.resultId === entry.id ? (
                  <View style={[styles.prTag, { backgroundColor: alpha(colors.palette.orange, 0.16) }]}>
                    <Text variant="caption" color={colors.palette.orange}>
                      PR
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Button
        label="Ajouter un résultat"
        icon="add"
        onPress={() => router.push('/(tabs)/add')}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  tagline: { maxWidth: 320, marginBottom: spacing.md },
  value: { letterSpacing: -2 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginVertical: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  section: { marginTop: spacing.xxl },
  standardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: 6 },
  flex: { flex: 1 },
  chartHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  targets: { gap: spacing.sm },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  targetBadge: {
    width: 38,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sim: { marginTop: spacing.md },
  historyCard: { paddingVertical: spacing.xs },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  prTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm },
  cta: { marginTop: spacing.xxl },
});
