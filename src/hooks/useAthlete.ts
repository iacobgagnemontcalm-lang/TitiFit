import { useMemo } from 'react';

import { computeAthleteState, type AthleteState } from '@/services/athleteService';
import { useAthleteStore } from '@/store/athleteStore';
import type { User } from '@/types';
import { todayISO } from '@/utils/date';

/**
 * The single derived-state hook. Everything (ratings, XP, streak, beer,
 * achievements, journey, projection) is recomputed from the raw store in one
 * memoized pass, so no screen can ever show a stale rating.
 */
export function useAthlete(): { user: User | null; state: AthleteState | null } {
  const user = useAthleteStore((s) => s.user);
  const results = useAthleteStore((s) => s.results);
  const xpTransactions = useAthleteStore((s) => s.xpTransactions);
  const unlockedAchievements = useAthleteStore((s) => s.unlockedAchievements);
  const settings = useAthleteStore((s) => s.settings);

  const state = useMemo(() => {
    if (!user) return null;
    return computeAthleteState({
      user,
      results,
      xpTransactions,
      unlockedAchievements,
      beerSettings: settings.beer,
      streakConfig: settings.streak,
      today: todayISO(),
    });
  }, [user, results, xpTransactions, unlockedAchievements, settings]);

  return { user, state };
}

/** Throwing variant for screens that are only reachable once onboarded. */
export function useAthleteOrThrow(): { user: User; state: AthleteState } {
  const { user, state } = useAthlete();
  if (!user || !state) throw new Error('useAthleteOrThrow used before onboarding');
  return { user, state };
}
