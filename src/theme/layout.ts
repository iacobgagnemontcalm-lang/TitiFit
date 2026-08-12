import { Platform, TextStyle } from 'react-native';

import { palette } from './colors';

/** 4pt base scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

/**
 * Type scale. Numeric/"stat" styles use tabular-ish mono so ratings do not
 * jitter while animating.
 */
export const typography = {
  display: { fontSize: 64, lineHeight: 66, fontWeight: '900', letterSpacing: -2 },
  h1: { fontSize: 30, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
  /** All-caps micro label used for section headers and chips. */
  overline: { fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 1.4 },
  stat: { fontFamily: mono, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  statSm: { fontFamily: mono, fontSize: 13, fontWeight: '700' },
} satisfies Record<string, TextStyle>;

/** Coloured outer glow used on hero cards and tier badges. */
export function glow(color: string, intensity: 'sm' | 'md' | 'lg' = 'md') {
  const map = { sm: { r: 10, o: 0.25 }, md: { r: 20, o: 0.35 }, lg: { r: 34, o: 0.45 } };
  const { r, o } = map[intensity];
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: o,
      shadowRadius: r,
      shadowOffset: { width: 0, height: 0 },
    },
    android: { elevation: Math.round(r / 3), shadowColor: color },
    default: { boxShadow: `0 0 ${r}px ${color}` },
  }) as object;
}

export const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: palette.void,
      shadowOpacity: 0.6,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 6 },
    default: { boxShadow: '0 8px 18px rgba(0,0,0,0.6)' },
  }) as object,
};

/** Height reserved under the tab bar so scroll views clear the floating dock. */
export const TAB_BAR_HEIGHT = 64;
