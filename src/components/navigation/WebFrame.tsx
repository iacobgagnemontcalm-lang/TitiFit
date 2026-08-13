import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/**
 * On the web, TitiFit is still a phone app. Left unconstrained on a desktop
 * browser it stretches a 1280px-wide column of mobile layout, which looks
 * broken rather than responsive.
 *
 * So the whole app is boxed into a phone-width column, centred, with the page
 * background filling the rest. The tab bar is absolutely positioned inside
 * this frame, so it stays glued to the column instead of spanning the window.
 *
 * On native this component is a pass-through — it costs nothing there.
 */
const MAX_WIDTH = 460;

export function WebFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={styles.page}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg.base,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    backgroundColor: colors.bg.base,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
});
