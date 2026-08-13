import { DEFAULT_BEER_SETTINGS } from '@/services/beerEngine';
import { DEFAULT_STREAK_CONFIG } from '@/services/streakEngine';
import type { BeerSettings, StreakConfig } from '@/types';

/**
 * Lives in its own module so both the store and the backend layer can depend on
 * it without creating an import cycle.
 */
export interface AppSettings {
  beer: BeerSettings;
  streak: StreakConfig;
  /** Hides Beer Earned everywhere, per spec. */
  hideBeerEarned: boolean;
  showSimulatedBadges: boolean;
  /** Opt out of appearing in public leaderboards. */
  publicProfile: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  beer: DEFAULT_BEER_SETTINGS,
  streak: DEFAULT_STREAK_CONFIG,
  hideBeerEarned: false,
  showSimulatedBadges: true,
  publicProfile: true,
};

/** Fills in any key a persisted or remote payload is missing. */
export function normalizeSettings(partial?: Partial<AppSettings> | null): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    beer: { ...DEFAULT_SETTINGS.beer, ...partial?.beer },
    streak: { ...DEFAULT_SETTINGS.streak, ...partial?.streak },
  };
}
