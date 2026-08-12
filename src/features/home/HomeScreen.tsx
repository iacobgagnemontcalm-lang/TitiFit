import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  BeerEarnedCard,
  CategoryCard,
  ChallengeCard,
  FastestPathCard,
  OverallHero,
  PRCard,
  ProjectionCard,
  StreakCard,
  XPCard,
} from '@/components/cards';
import {
  Card,
  Screen,
  SectionHeader,
  SimulatedBadge,
  StatTile,
  Text,
} from '@/components/ui';
import { CATEGORY_ORDER } from '@/data/categories';
import { OFFICIAL_TEST_IDS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { calculateFastestPath } from '@/services/fastestPath';
import { calculateTestRating } from '@/services/ratingEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { colors, spacing } from '@/theme';
import type { OfficialTestId, PersonalRecord } from '@/types';

export function HomeScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();
  const settings = useAthleteStore((s) => s.settings);
  const results = useAthleteStore((s) => s.results);

  const fastestPath = useMemo(() => {
    if (!user || !state) return null;
    return calculateFastestPath(state.officialBests, state.subject, { units: user.units });
  }, [user, state]);

  /** Most recent result that was a personal record, for the "dernier PR" card. */
  const lastPR = useMemo<{ record: PersonalRecord; delta?: number } | null>(() => {
    if (!state) return null;
    const records = OFFICIAL_TEST_IDS.map((id) => state.bests[id]).filter(
      (r): r is PersonalRecord => r != null,
    );
    if (records.length === 0) return null;
    const latest = [...records].sort((a, b) => b.date.localeCompare(a.date))[0]!;

    // Percentile gained versus the best that stood before this one.
    const earlier = results
      .filter((r) => r.testId === latest.testId && r.date < latest.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    if (!earlier) return { record: latest };

    const previousScore = calculateTestRating(
      latest.testId as OfficialTestId,
      earlier.metricValue,
      { ...state.subject, bodyWeightKg: earlier.bodyWeightKg },
    );

    return {
      record: latest,
      delta: previousScore
        ? Math.round((latest.percentile - previousScore.percentile) * 10) / 10
        : undefined,
    };
  }, [state, results]);

  if (!user || !state) {
    return (
      <Screen scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      </Screen>
    );
  }

  const { overall, level, streak, beer, challenges, projection } = state;
  const activeChallenge = challenges.find((c) => !c.completed) ?? challenges[0];
  const showBeer = settings.beer.enabled && !settings.hideBeerEarned;

  return (
    <Screen hero>
      {/* ---- Greeting -------------------------------------------------- */}
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <Text variant="h1" color={colors.text.primary}>
            {`Salut ${user.displayName} 👋`}
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            Découvre quel athlète tu es.
          </Text>
        </View>
        <Ionicons
          name="settings-outline"
          size={20}
          color={colors.text.faint}
          onPress={() => router.push('/settings')}
        />
      </View>

      {/* ---- Overall hero ---------------------------------------------- */}
      <View style={styles.hero}>
        <OverallHero
          overall={overall.value}
          percentile={overall.percentile}
          tier={overall.tier}
          athleteType={overall.athleteType}
          isProvisional={overall.isProvisional}
          completedTests={state.completedTests}
          totalTests={state.totalTests}
        />
        {settings.showSimulatedBadges ? <SimulatedBadge style={styles.simBadge} /> : null}
      </View>

      {/* ---- Quick stats ------------------------------------------------ */}
      <View style={styles.tiles}>
        <StatTile
          label="Niveau"
          value={`${level.level}`}
          hint={`${Math.round(level.progress * 100)}% vers ${level.level + 1}`}
          icon="sparkles"
          accent={colors.accent.primary}
        />
        <StatTile
          label="Série"
          value={`${streak.current} sem`}
          hint={`Record ${streak.longest}`}
          icon="flame"
          accent={colors.palette.orange}
        />
        {showBeer ? (
          <StatTile
            label="Beer"
            value={beer.week.toFixed(1)}
            hint="cette semaine"
            icon="beer"
            accent={colors.palette.amber}
          />
        ) : (
          <StatTile
            label="Tests"
            value={`${state.completedTests}/${state.totalTests}`}
            hint="complétés"
            icon="checkmark-done"
            accent={colors.state.positive}
          />
        )}
      </View>

      {/* ---- XP --------------------------------------------------------- */}
      <View style={styles.section}>
        <XPCard level={level} onPress={() => router.push('/progression')} />
      </View>

      {/* ---- Categories -------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader
          title="Les cinq catégories"
          subtitle="Chacune vaut 20 % de ton Overall"
          actionLabel="Tout voir"
          onAction={() => router.push('/categories')}
        />
        <View style={styles.categories}>
          {CATEGORY_ORDER.map((id) => (
            <CategoryCard
              key={id}
              rating={overall.categories[id]}
              compact
              onPress={() => router.push(`/category/${id}`)}
            />
          ))}
        </View>
      </View>

      {/* ---- Fastest path ------------------------------------------------ */}
      {fastestPath ? (
        <View style={styles.section}>
          <FastestPathCard plan={fastestPath} onPress={() => router.push('/fastest-path')} />
        </View>
      ) : null}

      {/* ---- Streak ------------------------------------------------------ */}
      <View style={styles.section}>
        <SectionHeader title="Constance" />
        <StreakCard streak={streak} />
      </View>

      {/* ---- Last PR ----------------------------------------------------- */}
      {lastPR ? (
        <View style={styles.section}>
          <SectionHeader
            title="Dernier record"
            actionLabel="Historique"
            onAction={() => router.push('/history')}
          />
          <PRCard record={lastPR.record} units={user.units} percentileDelta={lastPR.delta} />
        </View>
      ) : null}

      {/* ---- Challenge --------------------------------------------------- */}
      {activeChallenge ? (
        <View style={styles.section}>
          <SectionHeader title="Défi en cours" actionLabel="Tous les défis" onAction={() => router.push('/challenges')} />
          <ChallengeCard progress={activeChallenge} onPress={() => router.push('/challenges')} />
        </View>
      ) : null}

      {/* ---- Projection -------------------------------------------------- */}
      {projection ? (
        <View style={styles.section}>
          <SectionHeader title="Progression récente" />
          <ProjectionCard projection={projection} journey={state.journey} />
        </View>
      ) : null}

      {/* ---- Beer Earned ------------------------------------------------- */}
      {showBeer ? (
        <View style={styles.section}>
          <BeerEarnedCard beer={beer} />
        </View>
      ) : null}

      {/* ---- Data provenance --------------------------------------------- */}
      <Card style={styles.section} padded>
        <Text variant="overline" color={colors.text.faint} upper>
          À propos des percentiles
        </Text>
        <Text variant="caption" color={colors.text.secondary} style={styles.note}>
          Les percentiles te comparent à une population entraînée de même sexe,
          d’âge et de gabarit comparables — pas à la population générale. Les
          distributions actuelles sont simulées et seront remplacées par une
          vraie base de benchmarks.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  greetingText: { gap: 2, flex: 1 },
  hero: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  simBadge: { marginTop: spacing.xs },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  section: { marginTop: spacing.xxl },
  categories: { gap: spacing.sm },
  note: { marginTop: spacing.sm },
});
