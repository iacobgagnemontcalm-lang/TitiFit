import { categoryColors, palette, tierColors } from './colors';

export type Gradient = readonly [string, string, ...string[]];

export const gradients = {
  /** Hero / primary CTA */
  primary: [palette.violet, palette.electric] as const,
  /** Secondary, cooler */
  cool: [palette.electric, palette.cyan] as const,
  /** Attention / streak */
  heat: [palette.orange, palette.magenta] as const,
  /** Success / PR */
  success: [palette.lime, palette.green] as const,
  /** Deep background wash behind the home hero */
  hero: ['#1A1040', '#0B0B1E', palette.void] as const,
  /** Subtle card wash */
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.015)'] as const,
} satisfies Record<string, Gradient>;

export const categoryGradients = {
  strength: [categoryColors.strength, '#7C2D5B'],
  bodyweight: [categoryColors.bodyweight, '#4C1D95'],
  hybrid: [categoryColors.hybrid, '#9A3412'],
  speed: [categoryColors.speed, '#0E7490'],
  endurance: [categoryColors.endurance, '#3F6212'],
} satisfies Record<string, Gradient>;

export const tierGradients = {
  bronze: [tierColors.bronze, '#5A3216'],
  silver: [tierColors.silver, '#4A5468'],
  gold: [tierColors.gold, '#8A6512'],
  platinum: [tierColors.platinum, '#1E6F6B'],
  diamond: [tierColors.diamond, '#1E5F8F'],
  elite: [tierColors.elite, '#5B21B6'],
  legendary: [tierColors.legendary, '#7A1040'],
} satisfies Record<string, Gradient>;
