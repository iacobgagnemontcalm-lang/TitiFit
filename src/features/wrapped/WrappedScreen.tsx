import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Screen, SectionHeader, Text } from '@/components/ui';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { CATEGORIES } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { buildWrapped, wrappedShareText } from '@/services/wrappedEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, glow, radius, spacing } from '@/theme';
import { formatMonthYear } from '@/utils/date';

export function WrappedScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();
  const results = useAthleteStore((s) => s.results);
  const xpTransactions = useAthleteStore((s) => s.xpTransactions);
  const settings = useAthleteStore((s) => s.settings);

  const year = new Date().getFullYear();

  const wrapped = useMemo(() => {
    if (!user || !state) return null;
    return buildWrapped({ user, results, xpTransactions, settings, state, year });
  }, [user, state, results, xpTransactions, settings, year]);

  if (!user || !state || !wrapped) return null;

  const share = () =>
    Share.share({ message: wrappedShareText(wrapped, user.displayName) }).catch(() => undefined);

  if (!wrapped.hasData) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text variant="bodySm" color={colors.text.secondary}>
            Retour
          </Text>
        </Pressable>
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={30} color={colors.text.faint} />
          <Text variant="h2" color={colors.text.primary} center>
            {`Rien à raconter pour ${year}`}
          </Text>
          <Text variant="bodySm" color={colors.text.secondary} center>
            Enregistre des résultats cette année et ton Wrapped se remplira tout
            seul.
          </Text>
        </View>
      </Screen>
    );
  }

  const cells = [
    { label: 'Entraînements', value: `${wrapped.workouts}`, icon: 'barbell', accent: colors.palette.magenta },
    { label: 'Records', value: `${wrapped.personalRecords}`, icon: 'flame', accent: colors.palette.orange },
    { label: 'Jours actifs', value: `${wrapped.activeDays}`, icon: 'calendar', accent: colors.palette.cyan },
    { label: 'XP gagnés', value: `${wrapped.totalXP.toLocaleString('fr-CA')}`, icon: 'sparkles', accent: colors.accent.primary },
    { label: 'Série record', value: `${wrapped.longestStreak} sem`, icon: 'flash', accent: colors.palette.lime },
    ...(settings.hideBeerEarned
      ? []
      : [{ label: 'Beer Earned', value: `${wrapped.beers}`, icon: 'beer', accent: colors.palette.amber }]),
  ];

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        <Text variant="bodySm" color={colors.text.secondary}>
          Retour
        </Text>
      </Pressable>

      {/* --- Hero ---------------------------------------------------------- */}
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.hero, glow(colors.accent.primary, 'md')]}>
        <LinearGradient
          colors={['#3B1D7A', '#160F35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text variant="overline" color={colors.accent.secondary} upper>
          {`Your ${year} Athlete Wrapped`}
        </Text>
        <Text variant="display" color={colors.text.primary} style={styles.year}>
          {year}
        </Text>
        <Text variant="h3" color={colors.text.primary}>
          {user.displayName}
        </Text>
      </Animated.View>

      {/* --- Overall arc ---------------------------------------------------- */}
      {wrapped.overallGain != null ? (
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <Card accent={colors.accent.primary}>
            <Text variant="overline" color={colors.text.faint} upper>
              Ton Overall cette année
            </Text>
            <View style={styles.arc}>
              <Text variant="h1" color={colors.text.faint}>
                {wrapped.overallStart}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.text.faint} />
              <Text variant="display" color={colors.accent.primary} style={styles.arcEnd}>
                {wrapped.overallEnd}
              </Text>
            </View>
            <Text variant="bodySm" color={colors.text.secondary}>
              {wrapped.overallGain >= 0
                ? `+${wrapped.overallGain} points gagnés en ${year}.`
                : `${wrapped.overallGain} points cette année — une année de maintien.`}
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      {/* --- Numbers --------------------------------------------------------- */}
      <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
        <SectionHeader title="En chiffres" />
        <View style={styles.grid}>
          {cells.map((cell) => (
            <View key={cell.label} style={[styles.cell, { borderColor: alpha(cell.accent, 0.28) }]}>
              <Ionicons
                name={cell.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={cell.accent}
              />
              <Text variant="h1" color={colors.text.primary}>
                {cell.value}
              </Text>
              <Text variant="caption" color={colors.text.faint}>
                {cell.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* --- Highlights ------------------------------------------------------ */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
        <SectionHeader title="Tes moments" />
        <Card padded={false} style={styles.list}>
          {wrapped.bestCategory ? (
            <HighlightRow
              label="Meilleure catégorie"
              value={CATEGORIES[wrapped.bestCategory].name}
              detail={`${Math.round(state.overall.categories[wrapped.bestCategory].rating ?? 0)} de rating`}
              tint={colors.category[wrapped.bestCategory]}
            />
          ) : null}
          {wrapped.mostImprovedCategory && wrapped.mostImprovedGain != null ? (
            <HighlightRow
              label="Plus grosse progression"
              value={CATEGORIES[wrapped.mostImprovedCategory].name}
              detail={`${wrapped.mostImprovedGain >= 0 ? '+' : ''}${wrapped.mostImprovedGain} points`}
              tint={colors.category[wrapped.mostImprovedCategory]}
            />
          ) : wrapped.isFirstYear ? (
            <HighlightRow
              label="Progression"
              value="Première année"
              detail="pas de comparaison"
              tint={colors.text.faint}
            />
          ) : null}
          {wrapped.bestLift ? (
            <HighlightRow
              label="Meilleur lift"
              value={TESTS[wrapped.bestLift.testId].name}
              detail={wrapped.bestLift.label}
              tint={colors.category.strength}
            />
          ) : null}
          {wrapped.bestRun ? (
            <HighlightRow
              label="Meilleur run"
              value={TESTS[wrapped.bestRun.testId].name}
              detail={wrapped.bestRun.label}
              tint={colors.category.endurance}
            />
          ) : null}
          {wrapped.favouriteMonth ? (
            <HighlightRow
              label="Mois le plus chargé"
              value={formatMonthYear(wrapped.favouriteMonth)}
              tint={colors.accent.secondary}
            />
          ) : null}
        </Card>
      </Animated.View>

      {/* --- Archetype arc ---------------------------------------------------- */}
      <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.section}>
        <SectionHeader title="Ton archétype" />
        <Card accent={colors.accent.primary}>
          <View style={styles.typeArc}>
            <View style={styles.flex}>
              <Text variant="overline" color={colors.text.faint} upper>
                Début d’année
              </Text>
              <Text variant="h3" color={colors.text.secondary}>
                {wrapped.athleteTypeStart
                  ? ATHLETE_TYPE_BY_ID[wrapped.athleteTypeStart].name
                  : 'Non classé'}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.text.faint} />
            <View style={styles.flex}>
              <Text variant="overline" color={colors.accent.primary} upper>
                Aujourd’hui
              </Text>
              <Text variant="h3" color={colors.text.primary}>
                {ATHLETE_TYPE_BY_ID[wrapped.athleteTypeEnd].name}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Button
        label="Partager mon Wrapped"
        icon="share-social-outline"
        onPress={share}
        style={styles.share}
      />
    </Screen>
  );
}

function HighlightRow({
  label,
  value,
  detail,
  tint,
}: {
  label: string;
  value: string;
  detail?: string;
  tint: string;
}) {
  return (
    <View style={styles.highlight}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <View style={styles.flex}>
        <Text variant="caption" color={colors.text.faint}>
          {label}
        </Text>
        <Text variant="h3" color={colors.text.primary}>
          {value}
        </Text>
      </View>
      {detail ? (
        <Text variant="statSm" color={tint}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  year: { letterSpacing: -4 },
  section: { marginTop: spacing.xxl },
  arc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  arcEnd: { letterSpacing: -2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  list: { paddingVertical: spacing.xs },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  flex: { flex: 1 },
  typeArc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  share: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.huge },
});
