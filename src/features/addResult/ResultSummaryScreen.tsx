import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, DeltaChip, PercentileBadge, RatingCircle, Text, TierBadge } from '@/components/ui';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { CATEGORIES } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, glow, gradients, radius, spacing, tierGradients } from '@/theme';
import { formatMetric } from '@/utils/format';

/**
 * The eleven-step recap the spec asks for, as one scroll: performance → PR →
 * percentile → rating → category → Overall → XP → achievements → athlete type →
 * rarity. Everything animates in sequence so the numbers land one at a time.
 */
export function ResultSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const outcome = useAthleteStore((s) => s.lastOutcome);
  const clearLastOutcome = useAthleteStore((s) => s.clearLastOutcome);
  const user = useAthleteStore((s) => s.user);

  const close = () => {
    clearLastOutcome();
    router.back();
  };

  if (!outcome || !user) {
    return (
      <View style={[styles.root, styles.empty]}>
        <Text variant="body" color={colors.text.secondary}>
          Aucun résultat récent.
        </Text>
        <Button label="Fermer" variant="secondary" onPress={() => router.back()} full={false} />
      </View>
    );
  }

  const test = TESTS[outcome.result.testId];
  const tint = colors.category[test.category];
  const category = CATEGORIES[test.category];
  const overallDelta =
    outcome.overallBefore != null && outcome.overallAfter != null
      ? outcome.overallAfter - outcome.overallBefore
      : 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[alpha(tint, 0.35), '#0E0B22', colors.bg.base]}
        locations={[0, 0.45, 1]}
        style={styles.wash}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
      >
        <Pressable onPress={close} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.text.secondary} />
        </Pressable>

        {/* --- PR banner ------------------------------------------------- */}
        {outcome.isPR ? (
          <Animated.View entering={FadeInDown.duration(450)} style={styles.prBanner}>
            <LinearGradient
              colors={gradients.heat}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text variant="h2" color={colors.palette.white}>
              🔥 {outcome.isFirstTimeTest ? 'PREMIER RÉSULTAT' : 'NOUVEAU PR'}
            </Text>
          </Animated.View>
        ) : null}

        {/* --- Performance ------------------------------------------------ */}
        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.perf}>
          <Text variant="overline" color={colors.text.faint} upper>
            {test.name}
          </Text>
          <Text variant="display" color={colors.text.primary} style={styles.perfValue}>
            {formatMetric(test, outcome.result.metricValue, user.units)}
          </Text>
          {outcome.result.estimated ? (
            <Text variant="caption" color={colors.text.faint}>
              1RM estimé à partir de {outcome.result.raw.reps} répétitions
            </Text>
          ) : null}
        </Animated.View>

        {/* --- Percentile + rating ---------------------------------------- */}
        {outcome.rating != null ? (
          <Animated.View entering={FadeInDown.delay(260).duration(450)} style={styles.ratingRow}>
            <RatingCircle rating={outcome.rating} size={104} strokeWidth={9} color={tint} label="Rating" />
            <View style={styles.ratingMeta}>
              <PercentileBadge percentile={outcome.percentile} color={tint} />
              {outcome.percentileDelta ? (
                <DeltaChip value={outcome.percentileDelta} suffix=" pct" />
              ) : null}
              <Text variant="bodySm" color={colors.text.secondary}>
                {outcome.percentile != null
                  ? `Tu performes mieux qu’environ ${Math.round(outcome.percentile)} % de ton groupe de comparaison.`
                  : 'Test secondaire — aucun impact sur ton Overall.'}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(260).duration(450)}>
            <Text variant="bodySm" color={colors.text.faint} center>
              Test secondaire : enregistré dans ton historique, sans effet sur
              ton Overall Rating.
            </Text>
          </Animated.View>
        )}

        {/* --- Category + Overall ------------------------------------------ */}
        <Animated.View entering={FadeInDown.delay(400).duration(450)} style={styles.cards}>
          <TransitionCard
            label={category.name}
            before={outcome.categoryBefore}
            after={outcome.categoryAfter}
            tint={tint}
          />
          <TransitionCard
            label="Overall"
            before={outcome.overallBefore}
            after={outcome.overallAfter}
            tint={colors.accent.primary}
            highlight={overallDelta > 0}
          />
        </Animated.View>

        {/* --- Card upgrade ------------------------------------------------ */}
        {outcome.tierUpgraded ? (
          <TierUpgrade before={outcome.tierBefore} after={outcome.tierAfter} />
        ) : null}

        {/* --- Athlete type change ----------------------------------------- */}
        {outcome.athleteTypeChanged ? (
          <Animated.View
            entering={FadeInDown.delay(560).duration(450)}
            style={[styles.typeChange, { borderColor: alpha(colors.accent.primary, 0.4) }]}
          >
            <Text variant="overline" color={colors.accent.primary} upper>
              Nouvel archétype
            </Text>
            <Text variant="h2" color={colors.text.primary}>
              {ATHLETE_TYPE_BY_ID[outcome.athleteTypeAfter].name}
            </Text>
            <Text variant="bodySm" color={colors.text.secondary}>
              {ATHLETE_TYPE_BY_ID[outcome.athleteTypeAfter].description}
            </Text>
          </Animated.View>
        ) : null}

        {/* --- XP ----------------------------------------------------------- */}
        <Animated.View
          entering={FadeInDown.delay(640).duration(450)}
          style={[styles.xp, { borderColor: alpha(colors.accent.primary, 0.35) }]}
        >
          <View style={styles.xpHead}>
            <Ionicons name="sparkles" size={16} color={colors.accent.primary} />
            <Text variant="h2" color={colors.text.primary}>
              {`+${outcome.xp.total} XP`}
            </Text>
          </View>
          {outcome.xp.lines.map((line, i) => (
            <View key={`${line.label}-${i}`} style={styles.xpLine}>
              <Text variant="bodySm" color={colors.text.secondary} style={styles.flex}>
                {line.label}
              </Text>
              <Text variant="statSm" color={colors.accent.primary}>
                {`+${line.amount}`}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* --- Achievements -------------------------------------------------- */}
        {outcome.newAchievements.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(760).duration(450)} style={styles.achievements}>
            <Text variant="overline" color={colors.state.warning} upper>
              {`${outcome.newAchievements.length} achievement${outcome.newAchievements.length > 1 ? 's' : ''} débloqué${outcome.newAchievements.length > 1 ? 's' : ''}`}
            </Text>
            {outcome.newAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievement}>
                <View style={[styles.achievementIcon, { backgroundColor: alpha(colors.state.warning, 0.16) }]}>
                  <Ionicons
                    name={achievement.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={colors.state.warning}
                  />
                </View>
                <View style={styles.flex}>
                  <Text variant="h3" color={colors.text.primary}>
                    {achievement.name}
                  </Text>
                  <Text variant="caption" color={colors.text.faint}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        ) : null}

        {/* --- Beer earned --------------------------------------------------- */}
        {outcome.beersEarned > 0 ? (
          <Animated.View entering={FadeIn.delay(880)}>
            <Text variant="bodySm" color={colors.text.faint} center>
              {`🍺 ${outcome.beersEarned.toFixed(1)} Beer Earned pour cette séance`}
            </Text>
          </Animated.View>
        ) : null}

        <Button label="Continuer" onPress={close} style={styles.done} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------

function TransitionCard({
  label,
  before,
  after,
  tint,
  highlight,
}: {
  label: string;
  before: number | null;
  after: number | null;
  tint: string;
  highlight?: boolean;
}) {
  const changed = before != null && after != null && after !== before;

  return (
    <View
      style={[
        styles.transition,
        { borderColor: alpha(tint, changed ? 0.45 : 0.2) },
        highlight ? glow(tint, 'sm') : null,
      ]}
    >
      <Text variant="overline" color={colors.text.faint} upper>
        {label}
      </Text>
      <View style={styles.transitionRow}>
        <Text variant="h2" color={colors.text.faint}>
          {before ?? '—'}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.text.faint} />
        <Text variant="h2" color={changed ? tint : colors.text.primary}>
          {after ?? '—'}
        </Text>
      </View>
    </View>
  );
}

function TierUpgrade({ before, after }: { before: string; after: string }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        3,
        false,
      ),
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.03 }],
    opacity: 0.85 + pulse.value * 0.15,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(480).duration(500)}
      style={[styles.upgrade, animated]}
    >
      <LinearGradient
        colors={tierGradients[after as keyof typeof tierGradients]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text variant="overline" color="#0B0713" upper>
        Card upgrade
      </Text>
      <View style={styles.upgradeRow}>
        <TierBadge tier={before as never} size="sm" />
        <Ionicons name="arrow-forward" size={16} color="#0B0713" />
        <TierBadge tier={after as never} size="md" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 480 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl, alignItems: 'stretch' },
  close: { alignSelf: 'flex-end' },
  prBanner: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  perf: { alignItems: 'center', gap: spacing.xs },
  perfValue: { letterSpacing: -2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ratingMeta: { flex: 1, gap: spacing.sm, alignItems: 'flex-start' },
  cards: { flexDirection: 'row', gap: spacing.md },
  transition: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  transitionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  upgrade: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeChange: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  xp: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  xpHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  xpLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  achievements: { gap: spacing.md },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { marginTop: spacing.sm },
});
