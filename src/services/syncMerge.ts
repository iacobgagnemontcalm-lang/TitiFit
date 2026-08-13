import type { AthleteSnapshot } from '@/services/backend/types';

/**
 * Pure merge rules, kept free of any store or network import so they can be
 * reasoned about (and tested) on their own.
 */

function unionById<T>(remote: T[], local: T[], key: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(key(item), item);
  for (const item of local) map.set(key(item), item);
  return [...map.values()];
}

const emptySnapshot = (settings: AthleteSnapshot['settings']): AthleteSnapshot => ({
  user: null,
  settings,
  results: [],
  xpTransactions: [],
  unlockedAchievements: [],
  updatedAt: new Date().toISOString(),
});

/**
 * Remote is the base; local additions are layered on top.
 *
 *  - results / XP / achievements are **unioned by id**, so logging offline on
 *    one device and then opening another keeps both sets;
 *  - the profile and settings are resolved by `updatedAt` — last edit wins;
 *  - demo data never contaminates a real account: signing in discards it.
 */
export function mergeSnapshots(
  remote: AthleteSnapshot | null,
  local: AthleteSnapshot,
  localIsDemo: boolean,
): AthleteSnapshot {
  if (!remote) return localIsDemo ? emptySnapshot(local.settings) : local;
  if (localIsDemo) return remote;

  const remoteAt = remote.user?.updatedAt ?? remote.updatedAt ?? '';
  const localAt = local.user?.updatedAt ?? local.updatedAt ?? '';
  const localWins = localAt > remoteAt;

  return {
    user: (localWins ? local.user : remote.user) ?? remote.user ?? local.user,
    settings: (localWins ? local.settings : remote.settings) ?? local.settings,
    results: unionById(remote.results, local.results, (r) => r.id),
    xpTransactions: unionById(remote.xpTransactions, local.xpTransactions, (t) => t.id),
    unlockedAchievements: unionById(
      remote.unlockedAchievements,
      local.unlockedAchievements,
      (a) => a.achievementId,
    ),
    updatedAt: localWins ? localAt : remoteAt,
  };
}
