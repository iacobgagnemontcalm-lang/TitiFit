import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { alpha, colors, glow, gradients, radius, spacing, TAB_BAR_HEIGHT } from '@/theme';

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { on: 'home', off: 'home-outline', label: 'Accueil' },
  profile: { on: 'person', off: 'person-outline', label: 'Profil' },
  history: { on: 'time', off: 'time-outline', label: 'Historique' },
  leaderboard: { on: 'podium', off: 'podium-outline', label: 'Classement' },
};

/** Order matters: the central + is injected between `profile` and `history`. */
const LEFT = ['index', 'profile'];
const RIGHT = ['history', 'leaderboard'];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    Haptics.selectionAsync().catch(() => undefined);
    navigation.navigate(route.name as never);
  };

  const isActive = (name: string) => state.routes[state.index]?.name === name;

  const renderTab = (name: string) => {
    const config = ICONS[name];
    if (!config) return null;
    const active = isActive(name);

    return (
      <Pressable key={name} onPress={() => go(name)} style={styles.tab} hitSlop={6}>
        <Ionicons
          name={active ? config.on : config.off}
          size={21}
          color={active ? colors.accent.secondary : colors.text.faint}
        />
        <Text
          variant="caption"
          color={active ? colors.accent.secondary : colors.text.faint}
        >
          {config.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || spacing.sm }]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
      ) : (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      <View style={styles.bar}>
        {LEFT.map(renderTab)}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
            go('add');
          }}
          style={({ pressed }) => [styles.fab, glow(colors.accent.primary, 'md'), pressed && styles.fabPressed]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="add" size={30} color={colors.palette.white} />
        </Pressable>

        {RIGHT.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: alpha(colors.bg.base, 0.82),
  },
  webBlur: { backgroundColor: alpha(colors.bg.raised, 0.94) },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    marginTop: -26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: alpha(colors.palette.white, 0.16),
  },
  fabPressed: { transform: [{ scale: 0.94 }] },
});
