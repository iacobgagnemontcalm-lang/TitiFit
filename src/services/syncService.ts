import { getBackend } from '@/services/backend';
import type { AuthSession, PublicCard } from '@/services/backend/types';
import { useAthleteStore } from '@/store/athleteStore';
import { useAuthStore } from '@/store/authStore';
import type { CategoryId } from '@/types';
import { ageFromBirthDate } from '@/utils/date';

import { computeAthleteState } from './athleteService';
import { mergeSnapshots } from './syncMerge';
import { levelFromTotalXP } from './xpEngine';

export { mergeSnapshots } from './syncMerge';

/**
 * Keeps the local store and the backend in agreement.
 *
 * Design choices worth knowing:
 *  - **Offline-first.** AsyncStorage is always the working copy; the network is
 *    a background reconciliation. Losing connectivity never blocks the UI.
 *  - **Merge, don't overwrite.** Results, XP and achievements are unioned by
 *    id, so logging on a phone with no signal and then opening the app on a
 *    tablet keeps both sets.
 *  - **Demo data never syncs.** A seeded profile is discarded the moment a real
 *    account signs in.
 */

const PUSH_DEBOUNCE_MS = 2500;

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let unsubscribeAuth: (() => void) | undefined;
let unsubscribeStore: (() => void) | undefined;
let started = false;

// ---------------------------------------------------------------------------
// Public card projection
// ---------------------------------------------------------------------------

function buildPublicCard(uid: string): PublicCard | null {
  const store = useAthleteStore.getState();
  const { user, settings } = store;
  if (!user || !settings.publicProfile) return null;

  const state = computeAthleteState({
    user,
    results: store.results,
    xpTransactions: store.xpTransactions,
    unlockedAchievements: store.unlockedAchievements,
    beerSettings: settings.beer,
    streakConfig: settings.streak,
  });

  const categories = Object.entries(state.overall.categories).reduce(
    (acc, [id, rating]) => ({ ...acc, [id]: rating.rating }),
    {} as Record<CategoryId, number | null>,
  );

  return {
    uid,
    username: user.username,
    displayName: user.displayName,
    avatarUri: user.avatarUri,
    overall: state.overall.value,
    percentile: state.overall.percentile,
    tier: state.overall.tier,
    athleteType: state.overall.athleteType,
    level: levelFromTotalXP(state.level.totalXP).level,
    categories,
    sex: user.sex,
    age: ageFromBirthDate(user.birthDate),
    bodyWeightKg: user.bodyWeightKg,
    country: user.location?.country,
    region: user.location?.region,
    city: user.location?.city,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Push / pull
// ---------------------------------------------------------------------------

export async function pushNow(): Promise<void> {
  const auth = useAuthStore.getState();
  const store = useAthleteStore.getState();
  if (!auth.session || store.isDemo || !store.user) return;

  const backend = getBackend();
  auth.setSync({ status: 'syncing' });

  try {
    await backend.push(auth.session.uid, store.toSnapshot(), {
      removedResultIds: store.removedResultIds,
    });

    const card = buildPublicCard(auth.session.uid);
    if (card) await backend.publishCard(card);

    useAthleteStore.getState().markSynced();
    auth.setSync({ status: 'idle', lastSyncedAt: new Date().toISOString(), error: undefined });
  } catch (error) {
    auth.setSync({
      status: 'error',
      error: error instanceof Error ? error.message : 'Synchronisation impossible',
    });
  }
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = undefined;
    void pushNow();
  }, PUSH_DEBOUNCE_MS);
}

/** Pulls the remote snapshot, merges it into local state, then pushes back. */
export async function pullAndMerge(session: AuthSession): Promise<void> {
  const auth = useAuthStore.getState();
  const store = useAthleteStore.getState();
  const backend = getBackend();

  auth.setSync({ status: 'syncing' });
  try {
    const remote = await backend.pull(session.uid);
    const merged = mergeSnapshots(remote, store.toSnapshot(), store.isDemo);

    useAthleteStore.getState().applySnapshot(merged, session.uid);
    auth.setSync({ status: 'idle', lastSyncedAt: new Date().toISOString(), error: undefined });

    // Anything the server was missing goes up right away.
    if (merged.user) await pushNow();
  } catch (error) {
    auth.setSync({
      status: 'error',
      error: error instanceof Error ? error.message : 'Synchronisation impossible',
    });
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/** Called once from the root layout. Idempotent. */
export function startSync(): () => void {
  if (started) return stopSync;
  started = true;

  const backend = getBackend();

  unsubscribeAuth = backend.observeSession((session) => {
    useAuthStore.getState().setSession(session);
    if (session) void pullAndMerge(session);
  });

  unsubscribeStore = useAthleteStore.subscribe((state, previous) => {
    if (!state.dirty || state.dirty === previous.dirty) return;
    if (!useAuthStore.getState().session) return;
    schedulePush();
  });

  return stopSync;
}

export function stopSync(): void {
  unsubscribeAuth?.();
  unsubscribeStore?.();
  if (pushTimer) clearTimeout(pushTimer);
  unsubscribeAuth = undefined;
  unsubscribeStore = undefined;
  pushTimer = undefined;
  started = false;
}

// ---------------------------------------------------------------------------
// Auth actions (thin wrappers that keep the UI free of backend details)
// ---------------------------------------------------------------------------

async function runAuth<T>(action: () => Promise<T>): Promise<T | null> {
  const auth = useAuthStore.getState();
  auth.setBusy(true);
  auth.setError(null);
  try {
    return await action();
  } catch (error) {
    auth.setError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    return null;
  } finally {
    useAuthStore.getState().setBusy(false);
  }
}

export const signUp = (email: string, password: string, displayName: string) =>
  runAuth(() => getBackend().signUp(email, password, displayName));

export const signIn = (email: string, password: string) =>
  runAuth(() => getBackend().signIn(email, password));

export const signInAnonymously = () => runAuth(() => getBackend().signInAnonymously());

export const sendPasswordReset = (email: string) =>
  runAuth(() => getBackend().sendPasswordReset(email));

export async function signOut(): Promise<void> {
  await getBackend().signOut();
  useAuthStore.getState().setSession(null);
  useAthleteStore.getState().resetAll();
}
