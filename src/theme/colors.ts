/**
 * TitiFit palette.
 *
 * Direction: very dark base + saturated, electric accents. Every accent is
 * picked to stay readable on `bg.base` at 14px and above.
 */

export const palette = {
  // --- Neutrals (backgrounds & surfaces) -----------------------------------
  void: '#07070F',
  abyss: '#0C0C18',
  surface: '#13132364',
  ink900: '#101024',
  ink800: '#16162E',
  ink700: '#1E1E3A',
  ink600: '#2A2A4D',
  ink500: '#3A3A63',

  // --- Text ----------------------------------------------------------------
  white: '#FFFFFF',
  text: '#EEF0FF',
  textMuted: '#A2A6C9',
  textFaint: '#6E7299',

  // --- Accents -------------------------------------------------------------
  violet: '#8B5CF6',
  violetDeep: '#6D28D9',
  electric: '#3B82F6',
  cyan: '#22D3EE',
  lime: '#A3E635',
  green: '#34D399',
  orange: '#FB923C',
  amber: '#FBBF24',
  magenta: '#EC4899',
  rose: '#F43F5E',
  red: '#EF4444',
} as const;

/** Per-category identity colour. Used by rings, bars, chips and cards. */
export const categoryColors = {
  strength: palette.magenta,
  bodyweight: palette.violet,
  hybrid: palette.orange,
  speed: palette.cyan,
  endurance: palette.lime,
} as const;

/** Card rarity identity. Order matters — it is the progression ladder. */
export const tierColors = {
  bronze: '#C97A3D',
  silver: '#B8C2D9',
  gold: '#F2C14E',
  platinum: '#6EE7DF',
  diamond: '#7DD3FC',
  elite: '#C084FC',
  legendary: '#FF5EAE',
} as const;

export const colors = {
  bg: {
    base: palette.void,
    raised: palette.abyss,
    card: palette.ink900,
    cardAlt: palette.ink800,
    input: palette.ink800,
  },
  border: {
    subtle: 'rgba(255,255,255,0.07)',
    default: 'rgba(255,255,255,0.12)',
    strong: 'rgba(255,255,255,0.22)',
  },
  text: {
    primary: palette.text,
    secondary: palette.textMuted,
    faint: palette.textFaint,
    inverse: palette.void,
  },
  state: {
    positive: palette.green,
    negative: palette.rose,
    warning: palette.amber,
    info: palette.cyan,
  },
  accent: {
    primary: palette.violet,
    secondary: palette.cyan,
    tertiary: palette.magenta,
  },
  category: categoryColors,
  tier: tierColors,
  palette,
} as const;

/** Adds an alpha channel to a `#RRGGBB` string. */
export function alpha(hex: string, a: number): string {
  const clean = hex.replace('#', '').slice(0, 6);
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}

/**
 * Colour ramp used for any 0–100 rating: red → orange → lime → cyan → violet.
 * Keeps "how good is this number" readable before the user reads the number.
 */
export function ratingColor(rating: number): string {
  if (rating >= 90) return palette.violet;
  if (rating >= 80) return palette.cyan;
  if (rating >= 70) return palette.green;
  if (rating >= 60) return palette.lime;
  if (rating >= 50) return palette.amber;
  if (rating >= 35) return palette.orange;
  return palette.rose;
}
