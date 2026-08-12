import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { alpha, colors, radius, spacing } from '@/theme';

import { Screen } from './Screen';
import { Text } from './Text';

/**
 * Placeholder for screens scheduled in a later phase. It names the phase so the
 * roadmap is visible inside the app instead of only in the plan.
 */
export function ComingSoon({
  title,
  phase,
  description,
  icon = 'construct-outline',
}: {
  title: string;
  phase: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={30} color={colors.accent.primary} />
        </View>
        <Text variant="h1" color={colors.text.primary} center>
          {title}
        </Text>
        <View style={styles.phase}>
          <Text variant="caption" color={colors.accent.secondary} upper>
            {phase}
          </Text>
        </View>
        <Text variant="body" color={colors.text.secondary} center style={styles.desc}>
          {description}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.huge },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.accent.primary, 0.14),
    borderWidth: 1,
    borderColor: alpha(colors.accent.primary, 0.3),
  },
  phase: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.accent.secondary, 0.14),
  },
  desc: { maxWidth: 320 },
});
