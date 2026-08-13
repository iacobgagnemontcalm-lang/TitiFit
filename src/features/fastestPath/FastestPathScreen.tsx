import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, ProgressBar, Screen, SectionHeader, SimulatedBadge, Text } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { calculateFastestPath } from '@/services/fastestPath';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { FastestPathStep } from '@/types';

/** How ambitious the athlete wants to be, in Overall points above the current. */
const GOAL_OFFSETS = [1, 2, 5];

export function FastestPathScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();
  const showSimulated = useAthleteStore((s) => s.settings.showSimulatedBadges);
  const [offset, setOffset] = useState(1);

  const plan = useMemo(() => {
    if (!user || !state) return null;
    const current = state.overall.exact ?? 0;
    return calculateFastestPath(state.officialBests, state.subject, {
      units: user.units,
      goalOverall: Math.floor(current) + offset,
    });
  }, [user, state, offset]);

  if (!user || !state || !plan) return null;

  const remaining = Math.max(0, plan.goalOverall - plan.currentOverall);
  const minimumIds = new Set(plan.minimumSteps.map((s) => s.testId));

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
          Fastest Path
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          Ce que chaque amélioration rapporte réellement en points d’Overall.
        </Text>
      </View>

      {/* --- Goal picker -------------------------------------------------- */}
      <View style={styles.goals}>
        {GOAL_OFFSETS.map((value) => {
          const active = value === offset;
          const goal = Math.floor(plan.currentOverall) + value;
          return (
            <Pressable
              key={value}
              onPress={() => setOffset(value)}
              style={[
                styles.goal,
                {
                  borderColor: active ? alpha(colors.palette.lime, 0.6) : colors.border.default,
                  backgroundColor: active ? alpha(colors.palette.lime, 0.14) : 'transparent',
                },
              ]}
            >
              <Text variant="overline" color={colors.text.faint} upper>
                Objectif
              </Text>
              <Text variant="stat" color={active ? colors.palette.lime : colors.text.secondary}>
                {goal}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* --- Progress toward the goal -------------------------------------- */}
      <Card accent={colors.palette.lime} style={styles.progressCard}>
        <View style={styles.progressHead}>
          <Text variant="h2" color={colors.text.primary}>
            {plan.currentOverall.toFixed(1)}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text.faint} />
          <Text variant="h2" color={colors.palette.lime}>
            {plan.goalOverall}
          </Text>
          <View style={styles.flex} />
          <Text variant="statSm" color={colors.text.secondary}>
            {`${remaining.toFixed(1)} pt`}
          </Text>
        </View>
        <ProgressBar
          progress={1 - remaining / Math.max(1, plan.goalOverall - Math.floor(plan.currentOverall))}
          color={colors.palette.lime}
          height={8}
        />
        <Text variant="caption" color={colors.text.faint} style={styles.progressNote}>
          {plan.minimumSteps.length > 0
            ? `${plan.minimumSteps.length} amélioration${plan.minimumSteps.length > 1 ? 's' : ''} suffisent pour franchir ${plan.goalOverall}.`
            : 'Objectif déjà atteint.'}
        </Text>
      </Card>

      {/* --- Minimum path --------------------------------------------------- */}
      {plan.minimumSteps.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Le chemin le plus court"
            subtitle="Classé par gain d’Overall rapporté à l’effort"
          />
          <View style={styles.steps}>
            {plan.minimumSteps.map((step, index) => (
              <StepRow key={step.testId} step={step} index={index + 1} highlighted />
            ))}
          </View>
        </View>
      ) : null}

      {/* --- Every option --------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader
          title="Toutes les options"
          subtitle="Chaque test, avec ce qu’il rapporterait"
        />
        <View style={styles.steps}>
          {plan.steps
            .filter((s) => !minimumIds.has(s.testId))
            .map((step) => (
              <StepRow key={step.testId} step={step} />
            ))}
        </View>
      </View>

      {showSimulated ? <SimulatedBadge style={styles.sim} /> : null}

      <Text variant="caption" color={colors.text.faint} style={styles.explainer}>
        Chaque gain est calculé en rejouant réellement le moteur de rating sur
        une copie de tes records — pas par une règle de trois. C’est pourquoi il
        reste juste même quand ton Overall est encore provisoire.
      </Text>
    </Screen>
  );
}

function StepRow({
  step,
  index,
  highlighted,
}: {
  step: FastestPathStep;
  index?: number;
  highlighted?: boolean;
}) {
  const test = TESTS[step.testId];
  const tint = colors.category[step.categoryId];
  const effort =
    step.reachability > 0.6 ? 'accessible' : step.reachability > 0.35 ? 'exigeant' : 'ambitieux';

  return (
    <View
      style={[
        styles.step,
        {
          borderColor: highlighted ? alpha(colors.palette.lime, 0.4) : colors.border.subtle,
          backgroundColor: highlighted ? alpha(colors.palette.lime, 0.06) : colors.bg.card,
        },
      ]}
    >
      {index != null ? (
        <View style={[styles.stepIndex, { backgroundColor: alpha(colors.palette.lime, 0.16) }]}>
          <Text variant="statSm" color={colors.palette.lime}>
            {index}
          </Text>
        </View>
      ) : (
        <View style={[styles.stepDot, { backgroundColor: tint }]} />
      )}

      <View style={styles.stepBody}>
        <View style={styles.stepTitle}>
          <Text variant="h3" color={colors.text.primary}>
            {test.name}
          </Text>
          {step.isNewTest ? (
            <View style={[styles.newTag, { backgroundColor: alpha(colors.accent.secondary, 0.18) }]}>
              <Text variant="caption" color={colors.accent.secondary}>
                nouveau
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="statSm" color={colors.text.secondary}>
          {step.label}
        </Text>
        <Text variant="caption" color={colors.text.faint}>
          {`${CATEGORIES[step.categoryId].name} · rating ${Math.round(step.currentRating)} → ${Math.round(step.targetRating)} · ${effort}`}
        </Text>
      </View>

      <View style={styles.stepGain}>
        <Text variant="stat" color={colors.palette.lime}>
          {`+${step.overallGain.toFixed(1)}`}
        </Text>
        <Text variant="caption" color={colors.text.faint}>
          OVR
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: 2, marginTop: spacing.md, marginBottom: spacing.lg },
  goals: { flexDirection: 'row', gap: spacing.sm },
  goal: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  progressCard: { marginTop: spacing.lg },
  progressHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressNote: { marginTop: spacing.sm },
  flex: { flex: 1 },
  section: { marginTop: spacing.xxl },
  steps: { gap: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 10 },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm },
  stepGain: { alignItems: 'flex-end' },
  sim: { alignSelf: 'center', marginTop: spacing.xl },
  explainer: { marginTop: spacing.lg },
});
