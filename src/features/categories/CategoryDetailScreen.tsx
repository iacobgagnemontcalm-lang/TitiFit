import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  PercentileBadge,
  ProgressBar,
  RatingCircle,
  Screen,
  SectionHeader,
  Text,
} from '@/components/ui';
import { GAUNTLET_RULES, GAUNTLET_STATIONS, GAUNTLET_VERSION } from '@/data/hybridProtocol';
import { CATEGORIES } from '@/data/categories';
import { TESTS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { alpha, colors, radius, spacing } from '@/theme';
import type { CategoryId } from '@/types';
import { formatMetric } from '@/utils/format';
import { formatRelative } from '@/utils/date';

export function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: CategoryId }>();
  const { user, state } = useAthlete();

  const category = id ? CATEGORIES[id] : undefined;
  if (!category || !user || !state) return null;

  const rating = state.overall.categories[category.id];
  const tint = colors.category[category.id];

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        <Text variant="bodySm" color={colors.text.secondary}>
          Retour
        </Text>
      </Pressable>

      <View style={styles.hero}>
        <RatingCircle
          rating={rating.rating}
          size={148}
          strokeWidth={11}
          color={tint}
          label={category.name}
        />
        <PercentileBadge percentile={rating.percentile} color={tint} />
        <Text variant="bodySm" color={colors.text.secondary} center style={styles.description}>
          {category.description}
        </Text>
        <View style={[styles.weightPill, { borderColor: alpha(tint, 0.35) }]}>
          <Text variant="caption" color={colors.text.faint}>
            {`${Math.round(category.weight * 100)} % de l’Overall · ${rating.completedTests}/${rating.totalTests} tests`}
          </Text>
        </View>
      </View>

      {/* --- Tests officiels ---------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader
          title="Tests officiels"
          subtitle={
            rating.totalTests > 1
              ? `Le rating de la catégorie est la moyenne de ces ${rating.totalTests} tests`
              : 'Ce test définit à lui seul le rating de la catégorie'
          }
        />
        <View style={styles.tests}>
          {rating.tests.map((testRating) => {
            const test = TESTS[testRating.testId];
            const record = state.bests[testRating.testId];
            return (
              <Pressable
                key={testRating.testId}
                onPress={() => router.push(`/test/${testRating.testId}`)}
                style={({ pressed }) => [
                  styles.testRow,
                  { borderColor: testRating.rating != null ? alpha(tint, 0.3) : colors.border.subtle },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.testBody}>
                  <View style={styles.testTitle}>
                    <Text variant="h3" color={colors.text.primary}>
                      {test.name}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.text.faint} />
                  </View>
                  <Text variant="caption" color={colors.text.faint}>
                    {record ? formatRelative(record.date) : 'jamais testé'}
                  </Text>
                  <ProgressBar
                    progress={(testRating.rating ?? 0) / 100}
                    color={tint}
                    height={5}
                    style={styles.testBar}
                  />
                </View>
                <View style={styles.testValue}>
                  <Text
                    variant="stat"
                    color={testRating.rating != null ? tint : colors.text.faint}
                  >
                    {testRating.rating != null ? Math.round(testRating.rating) : '—'}
                  </Text>
                  <Text variant="statSm" color={colors.text.secondary}>
                    {record ? formatMetric(test, record.metricValue, user.units) : '—'}
                  </Text>
                  {testRating.percentile != null ? (
                    <PercentileBadge percentile={testRating.percentile} color={tint} size="sm" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- Le protocole Hybrid mérite sa propre section ------------------ */}
      {category.id === 'hybrid' ? (
        <View style={styles.section}>
          <SectionHeader title={`Protocole ${GAUNTLET_VERSION}`} subtitle="Le TitiFit Gauntlet" />
          <Card accent={tint}>
            {GAUNTLET_STATIONS.map((station) => (
              <View key={station.order} style={styles.station}>
                <View style={[styles.stationNumber, { backgroundColor: alpha(tint, 0.16) }]}>
                  <Text variant="statSm" color={tint}>
                    {station.order}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text variant="bodySm" color={colors.text.primary}>
                    {station.name}
                  </Text>
                  <Text variant="caption" color={colors.text.faint}>
                    {station.standard}
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.rules, { borderTopColor: colors.border.subtle }]}>
              {GAUNTLET_RULES.map((rule) => (
                <View key={rule} style={styles.ruleRow}>
                  <Ionicons name="ellipse" size={5} color={colors.text.faint} />
                  <Text variant="caption" color={colors.text.secondary} style={styles.flex}>
                    {rule}
                  </Text>
                </View>
              ))}
            </View>
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
  hero: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  description: { maxWidth: 330 },
  weightPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  section: { marginTop: spacing.xxl },
  tests: { gap: spacing.sm },
  testRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  pressed: { opacity: 0.75 },
  testBody: { flex: 1, gap: 4 },
  testTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  testBar: { marginTop: spacing.xs },
  testValue: { alignItems: 'flex-end', gap: 2 },
  station: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stationNumber: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  rules: { gap: 6, paddingTop: spacing.md, borderTopWidth: 1 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cta: { marginTop: spacing.xxl },
});
