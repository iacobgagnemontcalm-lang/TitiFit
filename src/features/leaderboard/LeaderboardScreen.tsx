import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Screen, SectionHeader, Text } from '@/components/ui';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories';
import { RIVAL_ATHLETES, RIVAL_LOCATIONS } from '@/data/mock/rivals';
import { TIER_BY_ID } from '@/data/tiers';
import { useAthlete } from '@/hooks/useAthlete';
import { getBackend } from '@/services/backend';
import type { PublicCard } from '@/services/backend/types';
import { useAuthStore } from '@/store/authStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { CategoryId } from '@/types';
import { ageFromBirthDate } from '@/utils/date';

type Metric = 'overall' | CategoryId;

/**
 * Reads the real `publicCards` collection when signed in; falls back to the
 * mock rivals otherwise so the screen is never empty. The source is always
 * stated explicitly — a leaderboard that quietly mixes real and fake athletes
 * would be worse than no leaderboard.
 */
export function LeaderboardScreen() {
  const { user, state } = useAthlete();
  const session = useAuthStore((s) => s.session);
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);

  const [metric, setMetric] = useState<Metric>('overall');
  const [remote, setRemote] = useState<PublicCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      setRemote(await getBackend().fetchLeaderboard(50));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Classement indisponible');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const isLive = session != null && remote != null && remote.length > 0;

  /** Everyone in the ranking, normalized to one shape. */
  const entries = useMemo(() => {
    const me =
      user && state
        ? [
            {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              overall: state.overall.value ?? 0,
              tier: state.overall.tier,
              level: state.level.level,
              location: user.location?.city,
              categories: CATEGORY_ORDER.reduce(
                (acc, id) => ({ ...acc, [id]: state.overall.categories[id].rating }),
                {} as Record<CategoryId, number | null>,
              ),
              isMe: true,
            },
          ]
        : [];

    const others = isLive
      ? remote!
          .filter((c) => c.uid !== session?.uid)
          .map((c) => ({
            userId: c.uid,
            username: c.username,
            displayName: c.displayName,
            overall: c.overall ?? 0,
            tier: c.tier,
            level: c.level,
            location: c.city ?? c.country,
            categories: c.categories,
            isMe: false,
          }))
      : RIVAL_ATHLETES.map((r) => ({
          userId: r.userId,
          username: r.username,
          displayName: r.displayName,
          overall: r.overall,
          tier: r.tier,
          level: r.level,
          location: RIVAL_LOCATIONS[r.userId],
          categories: r.categories,
          isMe: false,
        }));

    const valueOf = (e: (typeof others)[number]) =>
      metric === 'overall' ? e.overall : (e.categories[metric] ?? 0);

    return [...me, ...others]
      .sort((a, b) => valueOf(b) - valueOf(a))
      .map((e, i) => ({ ...e, rank: i + 1, value: valueOf(e) }));
  }, [user, state, isLive, remote, session, metric]);

  if (!user || !state) return null;

  const myRank = entries.find((e) => e.isMe)?.rank;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" color={colors.text.primary}>
          Classement
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          {myRank ? `Tu es ${myRank}e sur ${entries.length}` : 'Complète un test pour te classer'}
        </Text>
      </View>

      {/* --- Source disclosure -------------------------------------------- */}
      <View
        style={[
          styles.source,
          { borderColor: alpha(isLive ? colors.state.positive : colors.state.warning, 0.3) },
        ]}
      >
        <Ionicons
          name={isLive ? 'cloud-done-outline' : 'flask-outline'}
          size={13}
          color={isLive ? colors.state.positive : colors.state.warning}
        />
        <Text variant="caption" color={colors.text.faint} style={styles.flex}>
          {isLive
            ? `Classement en direct — ${remote!.length} athlète${remote!.length > 1 ? 's' : ''} publié${remote!.length > 1 ? 's' : ''}`
            : cloudEnabled
              ? session
                ? 'Aucun autre athlète publié pour l’instant — athlètes de démonstration affichés.'
                : 'Connecte-toi pour voir le vrai classement. Athlètes de démonstration affichés.'
              : 'Backend non configuré — athlètes de démonstration affichés.'}
        </Text>
        {session ? (
          <Pressable onPress={() => void load()} hitSlop={8}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent.secondary} />
            ) : (
              <Ionicons name="refresh" size={14} color={colors.accent.secondary} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={colors.state.negative} style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* --- Metric filter -------------------------------------------------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <FilterChip label="Overall" active={metric === 'overall'} onPress={() => setMetric('overall')} />
        {CATEGORY_ORDER.map((id) => (
          <FilterChip
            key={id}
            label={CATEGORIES[id].name}
            tint={colors.category[id]}
            active={metric === id}
            onPress={() => setMetric(id)}
          />
        ))}
      </ScrollView>

      <SectionHeader
        title={metric === 'overall' ? 'Overall Rating' : CATEGORIES[metric].name}
        subtitle={`${user.sex === 'female' ? 'F' : user.sex === 'male' ? 'H' : 'Mixte'} · ${ageFromBirthDate(user.birthDate)} ans`}
      />

      <Card padded={false} style={styles.list}>
        {entries.map((entry) => {
          const tint = metric === 'overall' ? colors.tier[entry.tier] : colors.category[metric];
          return (
            <View
              key={entry.userId}
              style={[
                styles.row,
                entry.isMe && { backgroundColor: alpha(colors.accent.primary, 0.12) },
              ]}
            >
              <Text
                variant="stat"
                color={entry.rank <= 3 ? colors.palette.amber : colors.text.faint}
                style={styles.rank}
              >
                {entry.rank}
              </Text>

              <View style={[styles.avatar, { borderColor: alpha(tint, 0.5) }]}>
                <Text variant="bodySm" color={tint}>
                  {entry.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text variant="h3" color={colors.text.primary} numberOfLines={1}>
                    {entry.displayName}
                  </Text>
                  {entry.isMe ? (
                    <View style={[styles.meTag, { backgroundColor: alpha(colors.accent.primary, 0.2) }]}>
                      <Text variant="caption" color={colors.accent.primary}>
                        toi
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" color={colors.text.faint} numberOfLines={1}>
                  {[`Niv. ${entry.level}`, entry.location, TIER_BY_ID[entry.tier].name]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>

              <Text variant="stat" color={tint}>
                {Math.round(entry.value)}
              </Text>
            </View>
          );
        })}
      </Card>

      <Text variant="caption" color={colors.text.faint} center style={styles.footnote}>
        Les filtres par ville, province, pays, âge et poids arriveront avec les
        index Firestore correspondants.
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

const styles = StyleSheet.create({
  header: { gap: 2, marginBottom: spacing.lg },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
    marginBottom: spacing.lg,
  },
  error: { marginBottom: spacing.md },
  filters: { gap: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
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
  rank: { width: 26, textAlign: 'center' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.input,
  },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm },
  footnote: { marginTop: spacing.lg },
});
