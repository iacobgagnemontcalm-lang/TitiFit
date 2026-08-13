import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, ProgressBar, Screen, SectionHeader, Text } from '@/components/ui';
import { ATHLETE_TYPE_BY_ID } from '@/data/athleteTypes';
import { CATEGORIES } from '@/data/categories';
import { RIVAL_ATHLETES } from '@/data/mock/rivals';
import { TIER_BY_ID } from '@/data/tiers';
import { useAthlete } from '@/hooks/useAthlete';
import { buildComparison, comparisonSummary, summaryFromAthlete } from '@/services/comparisonEngine';
import { useAuthStore } from '@/store/authStore';
import { alpha, colors, glow, radius, spacing } from '@/theme';
import type { AthleteSummary } from '@/types';

export function VersusScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();
  const session = useAuthStore((s) => s.session);
  const [opponentId, setOpponentId] = useState(RIVAL_ATHLETES[0]?.userId ?? '');

  const me = useMemo<AthleteSummary | null>(
    () => (user && state ? summaryFromAthlete(user, state.overall, state.level.totalXP) : null),
    [user, state],
  );

  const opponent = RIVAL_ATHLETES.find((r) => r.userId === opponentId) ?? RIVAL_ATHLETES[0];
  const comparison = me && opponent ? buildComparison(me, opponent) : null;

  if (!user || !state || !comparison || !opponent || !me) return null;

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
          Athlete VS
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          Cinq duels, un par catégorie. L’Overall ne décide rien ici.
        </Text>
      </View>

      {/* --- Opponent picker --------------------------------------------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.picker}
      >
        {RIVAL_ATHLETES.map((rival) => {
          const active = rival.userId === opponent.userId;
          const tint = colors.tier[rival.tier];
          return (
            <Pressable
              key={rival.userId}
              onPress={() => setOpponentId(rival.userId)}
              style={[
                styles.pickerItem,
                {
                  borderColor: active ? alpha(tint, 0.65) : colors.border.default,
                  backgroundColor: active ? alpha(tint, 0.14) : 'transparent',
                },
              ]}
            >
              <Text variant="bodySm" color={active ? colors.text.primary : colors.text.secondary}>
                {rival.displayName}
              </Text>
              <Text variant="statSm" color={tint}>
                {rival.overall}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* --- Scoreboard ---------------------------------------------------- */}
      <View style={styles.scoreboard}>
        <Fighter summary={me} side="left" wins={comparison.scoreA} />
        <View style={styles.versus}>
          <LinearGradient
            colors={[colors.palette.magenta, colors.palette.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text variant="h3" color={colors.palette.white}>
            VS
          </Text>
        </View>
        <Fighter summary={opponent} side="right" wins={comparison.scoreB} />
      </View>

      <View
        style={[
          styles.verdict,
          glow(comparison.winner === 'a' ? colors.state.positive : colors.palette.magenta, 'sm'),
          {
            borderColor: alpha(
              comparison.winner === 'tie'
                ? colors.text.faint
                : comparison.winner === 'a'
                  ? colors.state.positive
                  : colors.palette.magenta,
              0.45,
            ),
          },
        ]}
      >
        <Text variant="h2" color={colors.text.primary} center>
          {`${comparison.scoreA} – ${comparison.scoreB}`}
        </Text>
        <Text variant="bodySm" color={colors.text.secondary} center>
          {comparisonSummary(comparison)}
        </Text>
      </View>

      {/* --- Duels --------------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Les cinq duels" />
        <View style={styles.duels}>
          {comparison.duels.map((duel) => {
            const tint = colors.category[duel.categoryId];
            const total = (duel.a ?? 0) + (duel.b ?? 0) || 1;
            return (
              <Card key={duel.categoryId} accent={tint}>
                <View style={styles.duelHead}>
                  <Text
                    variant="stat"
                    color={duel.winner === 'a' ? colors.state.positive : colors.text.faint}
                  >
                    {duel.a != null ? Math.round(duel.a) : '—'}
                  </Text>
                  <View style={styles.duelTitle}>
                    <Text variant="overline" color={tint} upper>
                      {CATEGORIES[duel.categoryId].name}
                    </Text>
                    {duel.winner !== 'tie' ? (
                      <Ionicons
                        name={duel.winner === 'a' ? 'arrow-back' : 'arrow-forward'}
                        size={13}
                        color={duel.winner === 'a' ? colors.state.positive : colors.palette.magenta}
                      />
                    ) : (
                      <Text variant="caption" color={colors.text.faint}>
                        égalité
                      </Text>
                    )}
                  </View>
                  <Text
                    variant="stat"
                    color={duel.winner === 'b' ? colors.palette.magenta : colors.text.faint}
                  >
                    {duel.b != null ? Math.round(duel.b) : '—'}
                  </Text>
                </View>

                {/* Share-of-total bar: reads as a tug-of-war. */}
                <View style={styles.tugRow}>
                  <ProgressBar
                    progress={(duel.a ?? 0) / total}
                    color={colors.state.positive}
                    height={6}
                    style={styles.flex}
                  />
                  <ProgressBar
                    progress={(duel.b ?? 0) / total}
                    color={colors.palette.magenta}
                    height={6}
                    style={styles.flex}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      {!session ? (
        <Text variant="caption" color={colors.text.faint} center style={styles.note}>
          Les adversaires affichés sont des athlètes de démonstration. Une fois
          les amis branchés, tu pourras défier de vrais comptes.
        </Text>
      ) : null}
    </Screen>
  );
}

function Fighter({
  summary,
  side,
  wins,
}: {
  summary: AthleteSummary;
  side: 'left' | 'right';
  wins: number;
}) {
  const tint = colors.tier[summary.tier];
  return (
    <View style={[styles.fighter, side === 'right' && styles.fighterRight]}>
      <View style={[styles.fighterAvatar, { borderColor: alpha(tint, 0.6) }]}>
        <Text variant="h2" color={tint}>
          {summary.displayName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <Text variant="h3" color={colors.text.primary} numberOfLines={1}>
        {summary.displayName}
      </Text>
      <Text variant="caption" color={colors.text.faint} numberOfLines={1}>
        {ATHLETE_TYPE_BY_ID[summary.athleteType].name}
      </Text>
      <View style={[styles.fighterOvr, { backgroundColor: alpha(tint, 0.16) }]}>
        <Text variant="statSm" color={tint}>
          {`${summary.overall} · ${TIER_BY_ID[summary.tier].name}`}
        </Text>
      </View>
      <Text variant="stat" color={colors.text.primary}>
        {`${wins}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: 2, marginTop: spacing.md, marginBottom: spacing.lg },
  picker: { gap: spacing.sm, paddingBottom: spacing.xl, paddingRight: spacing.lg },
  pickerItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  scoreboard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fighter: { flex: 1, alignItems: 'center', gap: 3 },
  fighterRight: {},
  fighterAvatar: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
  },
  fighterOvr: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  versus: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  verdict: {
    gap: spacing.xs,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  section: { marginTop: spacing.xxl },
  duels: { gap: spacing.sm },
  duelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duelTitle: { alignItems: 'center', gap: 2 },
  tugRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
  note: { marginTop: spacing.xl },
});
