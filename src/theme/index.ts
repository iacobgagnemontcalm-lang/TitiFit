export * from './colors';
export * from './gradients';
export * from './layout';

import { colors } from './colors';
import { categoryGradients, gradients, tierGradients } from './gradients';
import { elevation, glow, radius, spacing, typography } from './layout';

export const theme = {
  colors,
  gradients,
  categoryGradients,
  tierGradients,
  spacing,
  radius,
  typography,
  elevation,
  glow,
} as const;

export type Theme = typeof theme;
