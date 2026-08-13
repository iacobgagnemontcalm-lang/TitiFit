import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChallengeCard } from '@/components/cards';
import { Card, Screen, SectionHeader, StatTile, Text } from '@/components/ui';
import { CHALLENGES } from '@/data/challenges';
import { calculateChallengeProgress } from '@/services/challengeEngine';
import { useAthleteStore } from '@/store/athleteStore';
import { colors, spacing } from '@/theme';
import { todayISO } from '@/utils/date';
import { formatShortDate } from '@/utils/date';

export function ChallengesScreen() {
  const router = useRouter();
  const results = useAthleteStore((s) => s.results);
  const today = todayISO();

  const { active, upcoming, past } = useMemo(() => {
    const scored = CHALLENGES.map((c) => calculateChallengeProgress(c, results));
    return {
      active: scored.filter((c) => c.challenge.startDate <= today && c.challenge.endDate >= today),
      upcoming: scored.filter((c) => c.challenge.startDate > today),
      past: scored.filter((c) => c.challenge.endDate < today),
    };
  }, [results, today]);

  const completed = [...active, ...past].filter((c) => c.completed).length;
  const totalXP = [...active, ...past]
    .filter((c) => c.completed)
    .reduce((s, c) => s + c.challenge.xpReward, 0);

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
          Défis
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          Des objectifs à durée limitée, calculés sur tes résultats réels.
        </Text>
      </View>

      <View style={styles.tiles}>
        <StatTile label="En cours" value={`${active.length}`} icon="flame" accent={colors.palette.orange} />
        <StatTile label="Complétés" value={`${completed}`} icon="checkmark-done" accent={colors.state.positive} />
        <StatTile label="XP gagnés" value={`${totalXP}`} icon="sparkles" accent={colors.accent.primary} />
      </View>

      {active.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="En cours" />
          <View style={styles.list}>
            {active.map((progress) => (
              <ChallengeCard key={progress.challenge.id} progress={progress} />
            ))}
          </View>
        </View>
      ) : (
        <Card style={styles.empty}>
          <Ionicons name="calendar-outline" size={24} color={colors.text.faint} />
          <Text variant="body" color={colors.text.secondary} center>
            Aucun défi actif en ce moment.
          </Text>
        </Card>
      )}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="À venir" />
          <View style={styles.list}>
            {upcoming.map((progress) => (
              <View key={progress.challenge.id} style={styles.upcoming}>
                <Text variant="h3" color={colors.text.primary}>
                  {progress.challenge.name}
                </Text>
                <Text variant="caption" color={colors.text.faint}>
                  {`Débute le ${formatShortDate(progress.challenge.startDate)} · +${progress.challenge.xpReward} XP`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {past.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Terminés" />
          <View style={styles.list}>
            {past.map((progress) => (
              <View key={progress.challenge.id} style={styles.pastRow}>
                <Ionicons
                  name={progress.completed ? 'checkmark-circle' : 'close-circle-outline'}
                  size={17}
                  color={progress.completed ? colors.state.positive : colors.text.faint}
                />
                <View style={styles.flex}>
                  <Text variant="bodySm" color={colors.text.primary}>
                    {progress.challenge.name}
                  </Text>
                  <Text variant="caption" color={colors.text.faint}>
                    {`${Math.round(progress.progress * 100)} % · terminé le ${formatShortDate(progress.challenge.endDate)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Text variant="caption" color={colors.text.faint} style={styles.note}>
        Les défis sont pour l’instant définis dans le code (`src/data/challenges.ts`).
        Une fois servis par le backend, ils pourront être saisonniers et communautaires.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: 2, marginTop: spacing.md, marginBottom: spacing.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  section: { marginTop: spacing.xxl },
  list: { gap: spacing.md },
  empty: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  upcoming: { gap: 2, paddingVertical: spacing.sm },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  note: { marginTop: spacing.xxl },
});
