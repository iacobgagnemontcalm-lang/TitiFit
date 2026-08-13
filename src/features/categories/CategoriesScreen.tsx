import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CategoryCard } from '@/components/cards';
import { Card, Screen, SectionHeader, SimulatedBadge, Text } from '@/components/ui';
import { CATEGORY_ORDER } from '@/data/categories';
import { useAthlete } from '@/hooks/useAthlete';
import { strongestCategory, weakestCategory } from '@/services/ratingEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { CATEGORIES } from '@/data/categories';
import { colors, spacing } from '@/theme';

export function CategoriesScreen() {
  const router = useRouter();
  const { state } = useAthlete();
  const showSimulated = useAthleteStore((s) => s.settings.showSimulatedBadges);

  if (!state) return null;

  const { overall } = state;
  const strongest = strongestCategory(overall.categories);
  const weakest = weakestCategory(overall.categories);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" color={colors.text.primary}>
          Catégories
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          Chaque catégorie vaut exactement 20 % de ton Overall Rating.
        </Text>
        {showSimulated ? <SimulatedBadge style={styles.sim} /> : null}
      </View>

      {/* --- Forces et faiblesses --------------------------------------- */}
      {strongest && weakest && strongest !== weakest ? (
        <Card style={styles.insight}>
          <View style={styles.insightRow}>
            <View style={styles.flex}>
              <Text variant="overline" color={colors.state.positive} upper>
                Point fort
              </Text>
              <Text variant="h3" color={colors.text.primary}>
                {CATEGORIES[strongest].name}
              </Text>
              <Text variant="statSm" color={colors.category[strongest]}>
                {Math.round(overall.categories[strongest].rating ?? 0)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.flex}>
              <Text variant="overline" color={colors.state.warning} upper>
                Point faible
              </Text>
              <Text variant="h3" color={colors.text.primary}>
                {CATEGORIES[weakest].name}
              </Text>
              <Text variant="statSm" color={colors.category[weakest]}>
                {Math.round(overall.categories[weakest].rating ?? 0)}
              </Text>
            </View>
          </View>
          <Text variant="caption" color={colors.text.faint} style={styles.insightNote}>
            {`C’est en ${CATEGORIES[weakest].name.toLowerCase()} que chaque point gagné coûte le moins d’effort — la marge y est la plus grande.`}
          </Text>
        </Card>
      ) : null}

      <View style={styles.list}>
        <SectionHeader title="Détail" />
        {CATEGORY_ORDER.map((id) => (
          <CategoryCard
            key={id}
            rating={overall.categories[id]}
            onPress={() => router.push(`/category/${id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.xl },
  sim: { marginTop: spacing.xs },
  insight: { marginBottom: spacing.xl },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  flex: { flex: 1, gap: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border.subtle },
  insightNote: { marginTop: spacing.md },
  list: { gap: spacing.md },
});
