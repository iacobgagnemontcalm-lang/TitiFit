import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, TAB_BAR_HEIGHT } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Adds a dark violet wash at the top — used on Home and the Athlete Card. */
  hero?: boolean;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  hero = false,
  scroll = true,
  padded = true,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        padded && styles.padded,
        { paddingTop: insets.top + spacing.sm },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      {hero ? (
        <LinearGradient
          colors={['#221252', '#0D0B22', colors.bg.base]}
          locations={[0, 0.45, 1]}
          style={styles.wash}
          pointerEvents="none"
        />
      ) : null}

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing.xxxl }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  padded: { paddingHorizontal: spacing.lg },
});
