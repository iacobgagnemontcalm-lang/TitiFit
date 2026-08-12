import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { BeerSummary } from '@/types';

/**
 * BEER EARNED 🍺 — humour, not nutrition advice. The disclaimer stays on the
 * card, and the whole block can be hidden from Settings.
 */
export function BeerEarnedCard({ beer }: { beer: BeerSummary }) {
  const cells: { label: string; value: string }[] = [
    { label: 'Jour', value: beer.today.toFixed(1) },
    { label: 'Semaine', value: beer.week.toFixed(1) },
    { label: 'Mois', value: beer.month.toFixed(1) },
    { label: 'All-time', value: `${beer.allTime}` },
  ];

  return (
    <Card accent={colors.palette.amber}>
      <View style={styles.head}>
        <Text variant="h2" color={colors.text.primary}>
          🍺 Beer Earned
        </Text>
        <Text variant="stat" color={colors.palette.amber}>
          {beer.today.toFixed(1)}
        </Text>
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.cell}>
            <Text variant="overline" color={colors.text.faint} upper numberOfLines={1}>
              {cell.label}
            </Text>
            <Text variant="statSm" color={colors.text.primary}>
              {cell.value}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="caption" color={colors.text.faint} style={styles.disclaimer}>
        Équivalent énergétique de tes entraînements, en bières de référence
        (165 kcal). C’est une blague, pas une recommandation de consommation.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1, gap: 2 },
  disclaimer: { marginTop: spacing.md },
});
