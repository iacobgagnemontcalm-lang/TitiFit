import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PercentileBadge, Screen, SectionHeader, Text } from '@/components/ui';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { TESTS, isOfficialTest } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { calculateTestRating } from '@/services/ratingEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { CategoryId, TestResult } from '@/types';
import { formatMetric } from '@/utils/format';
import { formatShortDate, monthKey, formatMonthYear } from '@/utils/date';

type Filter = 'all' | CategoryId;

/**
 * Every result ever logged, newest first, grouped by month. Each row is scored
 * live against the athlete's *current* comparison group, so an old lift shows
 * what it would be worth today.
 */
export function HistoryScreen() {
  const { user, state } = useAthlete();
  const results = useAthleteStore((s) => s.results);
  const deleteResult = useAthleteStore((s) => s.deleteResult);
  const [filter, setFilter] = useState<Filter>('all');

  const grouped = useMemo(() => {
    const filtered = results
      .filter((r) => filter === 'all' || TESTS[r.testId].category === filter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    const byMonth = new Map<string, TestResult[]>();
    for (const result of filtered) {
      const key = monthKey(result.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), result]);
    }
    return [...byMonth.entries()];
  }, [results, filter]);

  if (!user || !state) return null;

  const confirmDelete = (result: TestResult) => {
    const label = `${TESTS[result.testId].name} · ${formatShortDate(result.date)}`;
    Alert.alert('Supprimer ce résultat?', `${label}\n\nTon Overall sera recalculé.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteResult(result.id) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" color={colors.text.primary}>
          Historique
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          {`${results.length} résultat${results.length > 1 ? 's' : ''} · ${state.career.totalPRs} record${state.career.totalPRs > 1 ? 's' : ''} personnel${state.career.totalPRs > 1 ? 's' : ''}`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <FilterChip label="Tout" active={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORY_ORDER.map((id) => (
          <FilterChip
            key={id}
            label={CATEGORIES[id].name}
            tint={colors.category[id]}
            active={filter === id}
            onPress={() => setFilter(id)}
          />
        ))}
      </ScrollView>

      {grouped.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={28} color={colors.text.faint} />
          <Text variant="body" color={colors.text.secondary} center>
            Aucun résultat pour ce filtre.
          </Text>
        </View>
      ) : (
        grouped.map(([month, monthResults]) => (
          <View key={month} style={styles.month}>
            <SectionHeader title={formatMonthYear(month)} />
            <View style={styles.rows}>
              {monthResults.map((result) => (
                <HistoryRow
                  key={result.id}
                  result={result}
                  units={user.units}
                  subject={state.subject}
                  isCurrentBest={state.bests[result.testId]?.resultId === result.id}
                  onLongPress={() => confirmDelete(result)}
                />
              ))}
            </View>
          </View>
        ))
      )}

      <Text variant="caption" color={colors.text.faint} center style={styles.hint}>
        Appui long sur un résultat pour le supprimer.
      </Text>
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  tint = colors.accent.secondary,
  onPress,
}: {
  label: string;
  active: boolean;
  tint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? alpha(tint, 0.6) : colors.border.default,
          backgroundColor: active ? alpha(tint, 0.16) : 'transparent',
        },
      ]}
    >
      <Text variant="bodySm" color={active ? tint : colors.text.secondary}>
        {label}
      </Text>
    </Pressable>
  );
}

function HistoryRow({
  result,
  units,
  subject,
  isCurrentBest,
  onLongPress,
}: {
  result: TestResult;
  units: Parameters<typeof formatMetric>[2];
  subject: Parameters<typeof calculateTestRating>[2];
  isCurrentBest: boolean;
  onLongPress: () => void;
}) {
  const test = TESTS[result.testId];
  const tint = colors.category[test.category];

  const scored = isOfficialTest(result.testId)
    ? calculateTestRating(result.testId, result.metricValue, {
        ...subject,
        bodyWeightKg: result.bodyWeightKg,
      })
    : null;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.row,
        { borderColor: isCurrentBest ? alpha(tint, 0.45) : colors.border.subtle },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tint }]} />

      <View style={styles.rowBody}>
        <View style={styles.rowTitle}>
          <Text variant="h3" color={colors.text.primary}>
            {test.name}
          </Text>
          {isCurrentBest ? (
            <View style={[styles.prTag, { backgroundColor: alpha(colors.palette.orange, 0.16) }]}>
              <Text variant="caption" color={colors.palette.orange}>
                PR
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" color={colors.text.faint}>
          {[
            formatShortDate(result.date),
            result.estimated ? '1RM estimé' : null,
            result.rpe ? `RPE ${result.rpe}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {result.notes ? (
          <Text variant="caption" color={colors.text.secondary} numberOfLines={2}>
            {result.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowValue}>
        <Text variant="stat" color={colors.text.primary}>
          {formatMetric(test, result.metricValue, units)}
        </Text>
        {scored ? <PercentileBadge percentile={scored.percentile} color={tint} size="sm" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  filters: { gap: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  month: { marginBottom: spacing.xl },
  rows: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm },
  rowValue: { alignItems: 'flex-end', gap: 3 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.huge },
  hint: { marginTop: spacing.lg },
});
