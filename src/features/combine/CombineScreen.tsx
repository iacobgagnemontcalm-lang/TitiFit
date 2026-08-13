import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Field, Screen, SectionHeader, Text } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { RIVAL_ATHLETES } from '@/data/mock/rivals';
import { OFFICIAL_TESTS, TESTS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { computeCombine, entriesFromSummaries } from '@/services/combineEngine';
import { summaryFromAthlete } from '@/services/comparisonEngine';
import { alpha, colors, radius, spacing } from '@/theme';
import type { Combine, OfficialTestId } from '@/types';
import { todayISO } from '@/utils/date';

export function CombineScreen() {
  const router = useRouter();
  const { user, state } = useAthlete();

  const [name, setName] = useState('Summer Combine 2027');
  const [testIds, setTestIds] = useState<OfficialTestId[]>(
    OFFICIAL_TESTS.map((t) => t.id as OfficialTestId),
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    RIVAL_ATHLETES.slice(0, 4).map((r) => r.userId),
  );

  const me = useMemo(
    () => (user && state ? summaryFromAthlete(user, state.overall, state.level.totalXP) : null),
    [user, state],
  );

  const results = useMemo(() => {
    if (!me || testIds.length === 0) return null;
    const athletes = [me, ...RIVAL_ATHLETES.filter((r) => participantIds.includes(r.userId))];
    const combine: Combine = {
      id: 'local',
      name,
      date: todayISO(),
      hostUserId: me.userId,
      testIds,
      participants: athletes.map((a) => ({ userId: a.userId, username: a.username })),
      status: 'open',
    };
    return computeCombine(combine, entriesFromSummaries(athletes, testIds));
  }, [me, participantIds, testIds, name]);

  if (!user || !state || !me) return null;

  const toggleTest = (id: OfficialTestId) =>
    setTestIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const toggleParticipant = (id: string) =>
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const nameOf = (userId: string) =>
    userId === me.userId
      ? me.displayName
      : (RIVAL_ATHLETES.find((r) => r.userId === userId)?.displayName ?? '—');

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
          Create a Combine
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          Un événement entre amis. Chaque test est noté sur son rating, pas sur
          la performance brute — sinon on classerait les gens par poids de corps.
        </Text>
      </View>

      <Field label="Nom de l’événement" value={name} onChangeText={setName} autoCapitalize="words" />

      {/* --- Tests --------------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Tests" subtitle={`${testIds.length} sélectionné${testIds.length > 1 ? 's' : ''}`} />
        <View style={styles.grid}>
          {OFFICIAL_TESTS.map((test) => {
            const id = test.id as OfficialTestId;
            const active = testIds.includes(id);
            const tint = colors.category[test.category];
            return (
              <Pressable
                key={id}
                onPress={() => toggleTest(id)}
                style={[
                  styles.pill,
                  {
                    borderColor: active ? alpha(tint, 0.6) : colors.border.default,
                    backgroundColor: active ? alpha(tint, 0.14) : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={active ? tint : colors.text.faint}
                />
                <Text variant="bodySm" color={active ? colors.text.primary : colors.text.secondary}>
                  {test.shortName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- Participants --------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader
          title="Participants"
          subtitle={`${participantIds.length + 1} athlètes, toi inclus`}
        />
        <View style={styles.grid}>
          {RIVAL_ATHLETES.map((rival) => {
            const active = participantIds.includes(rival.userId);
            return (
              <Pressable
                key={rival.userId}
                onPress={() => toggleParticipant(rival.userId)}
                style={[
                  styles.pill,
                  {
                    borderColor: active
                      ? alpha(colors.accent.secondary, 0.6)
                      : colors.border.default,
                    backgroundColor: active ? alpha(colors.accent.secondary, 0.14) : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={active ? 'person' : 'person-outline'}
                  size={13}
                  color={active ? colors.accent.secondary : colors.text.faint}
                />
                <Text variant="bodySm" color={active ? colors.text.primary : colors.text.secondary}>
                  {rival.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- Standings ------------------------------------------------------ */}
      {results && testIds.length > 0 ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="Classement général" subtitle="Moyenne des ratings sur les tests choisis" />
            <Card padded={false} style={styles.list}>
              {results.standings.map((standing) => {
                const isMe = standing.userId === me.userId;
                return (
                  <View
                    key={standing.userId}
                    style={[styles.row, isMe && { backgroundColor: alpha(colors.accent.primary, 0.12) }]}
                  >
                    <Text
                      variant="stat"
                      color={standing.rank <= 3 ? colors.palette.amber : colors.text.faint}
                      style={styles.rank}
                    >
                      {standing.rank}
                    </Text>
                    <View style={styles.flex}>
                      <Text variant="h3" color={colors.text.primary}>
                        {nameOf(standing.userId)}
                      </Text>
                      {standing.awards.length > 0 ? (
                        <Text variant="caption" color={colors.palette.amber}>
                          {standing.awards.join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text variant="stat" color={colors.accent.secondary}>
                      {standing.points.toFixed(1)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </View>

          {/* --- Awards ------------------------------------------------------ */}
          <View style={styles.section}>
            <SectionHeader title="Titres" />
            <View style={styles.awards}>
              {results.awards.map((award) => (
                <View
                  key={award.id}
                  style={[styles.award, { borderColor: alpha(colors.palette.amber, 0.3) }]}
                >
                  <View style={[styles.awardIcon, { backgroundColor: alpha(colors.palette.amber, 0.16) }]}>
                    <Ionicons
                      name={award.icon as keyof typeof Ionicons.glyphMap}
                      size={15}
                      color={colors.palette.amber}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="h3" color={colors.text.primary}>
                      {award.label}
                    </Text>
                    <Text variant="caption" color={colors.text.faint}>
                      {award.detail}
                    </Text>
                  </View>
                  <Text variant="statSm" color={colors.palette.amber}>
                    {nameOf(award.userId)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* --- Per category ------------------------------------------------ */}
          <View style={styles.section}>
            <SectionHeader title="Par catégorie" />
            <Card padded={false} style={styles.list}>
              {results.perCategory.map(({ categoryId, ranking }) => (
                <View key={categoryId} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: colors.category[categoryId] }]} />
                  <Text variant="bodySm" color={colors.text.secondary} style={styles.flex}>
                    {CATEGORIES[categoryId].name}
                  </Text>
                  <Text variant="bodySm" color={colors.text.primary}>
                    {ranking[0] ? nameOf(ranking[0].userId) : '—'}
                  </Text>
                  <Text variant="statSm" color={colors.category[categoryId]}>
                    {ranking[0] ? ranking[0].rating.toFixed(1) : '—'}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        </>
      ) : (
        <Card style={styles.empty}>
          <Text variant="bodySm" color={colors.text.secondary} center>
            Sélectionne au moins un test pour générer le classement.
          </Text>
        </Card>
      )}

      <Text variant="caption" color={colors.text.faint} style={styles.note}>
        Les participants sont des athlètes de démonstration, et leurs notes par
        test reprennent leur rating de catégorie. Une vraie combine capturerait
        des résultats frais le jour même — c’est la prochaine étape, une fois
        les amis branchés sur le backend.
      </Text>

      <Pressable
        onPress={() => router.push(`/test/${TESTS[testIds[0] ?? 'deadlift'].id}`)}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={16} color={colors.accent.secondary} />
        <Text variant="h3" color={colors.accent.secondary}>
          Enregistrer mes résultats
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg },
  section: { marginTop: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  list: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rank: { width: 24, textAlign: 'center' },
  flex: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  awards: { gap: spacing.sm },
  award: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  awardIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { marginTop: spacing.xxl },
  note: { marginTop: spacing.xxl },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.accent.secondary, 0.4),
  },
  pressed: { opacity: 0.75 },
});
