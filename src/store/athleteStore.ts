import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEMO_USER, buildDemoResults } from '@/data/mock/demoAthlete';
import { computeAthleteState } from '@/services/athleteService';
import {
  processAddResult,
  unlockedFromAchievements,
  type AddResultInput,
  type AddResultOutcome,
} from '@/services/addResultFlow';
import type { AthleteSnapshot } from '@/services/backend/types';
import type {
  TestResult,
  UnlockedAchievement,
  User,
  XPTransaction,
} from '@/types';
import { todayISO } from '@/utils/date';

import { DEFAULT_SETTINGS, normalizeSettings, type AppSettings } from './settings';

/**
 * Single source of truth for everything the athlete *entered*. Nothing derived
 * is stored — ratings, XP totals, streaks and achievements are recomputed from
 * these primitives (see `useAthlete`).
 *
 * Persistence has two layers:
 *   1. AsyncStorage (always) — the offline cache, written by `persist`;
 *   2. the backend (when signed in) — driven by `syncService`, which reads
 *      `dirty` / `removedResultIds` to know what still needs pushing.
 */

interface AthleteStoreState {
  hydrated: boolean;
  onboarded: boolean;
  /** True while the seeded demo athlete is loaded — never pushed to the cloud. */
  isDemo: boolean;
  user: User | null;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  unlockedAchievements: UnlockedAchievement[];
  settings: AppSettings;
  /** Outcome of the most recent ADD RESULT, consumed by the summary screen. */
  lastOutcome: AddResultOutcome | null;
  /** Set on every local mutation, cleared once the backend confirms a push. */
  dirty: boolean;
  /** Results deleted locally that still need deleting server-side. */
  removedResultIds: string[];
}

interface AthleteStoreActions {
  setHydrated: () => void;
  completeOnboarding: (user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  addResult: (input: AddResultInput) => AddResultOutcome | null;
  deleteResult: (id: string) => void;
  clearLastOutcome: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  loadDemoAthlete: () => void;
  resetAll: () => void;
  /** Replaces local state with a remote snapshot (merged by `syncService`). */
  applySnapshot: (snapshot: AthleteSnapshot, uid: string) => void;
  markSynced: () => void;
  /** Swaps device-local image paths for the durable URLs returned by upload. */
  replaceImageUris: (user: User | null, results: TestResult[]) => void;
  toSnapshot: () => AthleteSnapshot;
}

export type AthleteStore = AthleteStoreState & AthleteStoreActions;

const EMPTY_STATE: AthleteStoreState = {
  hydrated: false,
  onboarded: false,
  isDemo: false,
  user: null,
  results: [],
  xpTransactions: [],
  unlockedAchievements: [],
  settings: DEFAULT_SETTINGS,
  lastOutcome: null,
  dirty: false,
  removedResultIds: [],
};

export const useAthleteStore = create<AthleteStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      setHydrated: () => set({ hydrated: true }),

      completeOnboarding: (user) =>
        set({
          user: { ...user, updatedAt: new Date().toISOString() },
          onboarded: true,
          isDemo: false,
          dirty: true,
        }),

      updateUser: (patch) =>
        set((state) =>
          state.user
            ? {
                user: { ...state.user, ...patch, updatedAt: new Date().toISOString() },
                dirty: true,
              }
            : state,
        ),

      addResult: (input) => {
        const state = get();
        if (!state.user) return null;

        const outcome = processAddResult(input, {
          user: state.user,
          results: state.results,
          xpTransactions: state.xpTransactions,
          unlockedAchievements: state.unlockedAchievements,
          beerSettings: state.settings.beer,
          streakConfig: state.settings.streak,
        });

        set({
          results: [...state.results, outcome.result],
          xpTransactions: [...state.xpTransactions, ...outcome.xpTransactions],
          unlockedAchievements: [
            ...state.unlockedAchievements,
            ...unlockedFromAchievements(outcome.newAchievements, outcome.result.date),
          ],
          lastOutcome: outcome,
          dirty: true,
        });

        return outcome;
      },

      deleteResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
          xpTransactions: state.xpTransactions.filter((t) => t.sourceId !== id),
          removedResultIds: [...state.removedResultIds, id],
          dirty: true,
        })),

      clearLastOutcome: () => set({ lastOutcome: null }),

      updateSettings: (patch) =>
        set((state) => ({
          settings: normalizeSettings({ ...state.settings, ...patch }),
          dirty: true,
        })),

      /**
       * Seeds the demo athlete so every screen has data to show. Marked
       * `isDemo` so it is never pushed to a real account.
       */
      loadDemoAthlete: () => {
        const results = buildDemoResults();
        const xpTransactions: XPTransaction[] = results.map((r, i) => ({
          id: `xp_demo_${i}`,
          amount: 150,
          reason: 'result_logged',
          label: 'Historique importé',
          date: r.date,
          sourceId: r.id,
        }));
        // Lands the demo athlete at level 16 with ~15 450 / 20 100 XP.
        xpTransactions.push({
          id: 'xp_demo_bonus',
          amount: 138_550,
          reason: 'achievement_unlocked',
          label: 'Progression cumulée',
          date: todayISO(),
        });

        // Achievements the seeded history already earned are unlocked up front,
        // otherwise the first real result would dump twenty of them at once.
        const seeded = computeAthleteState({
          user: DEMO_USER,
          results,
          xpTransactions,
          unlockedAchievements: [],
          beerSettings: get().settings.beer,
          streakConfig: get().settings.streak,
        });
        const lastDate = results[results.length - 1]?.date ?? todayISO();

        set({
          user: DEMO_USER,
          onboarded: true,
          isDemo: true,
          results,
          xpTransactions,
          unlockedAchievements: seeded.achievements
            .filter((a) => a.unlocked)
            .map((a) => ({ achievementId: a.achievement.id, date: lastDate })),
          lastOutcome: null,
          dirty: false,
          removedResultIds: [],
        });
      },

      resetAll: () => set({ ...EMPTY_STATE, hydrated: true }),

      applySnapshot: (snapshot, uid) =>
        set({
          user: snapshot.user ? { ...snapshot.user, remoteUid: uid } : null,
          results: snapshot.results,
          xpTransactions: snapshot.xpTransactions,
          unlockedAchievements: snapshot.unlockedAchievements,
          settings: normalizeSettings(snapshot.settings),
          onboarded: snapshot.user != null,
          isDemo: false,
          dirty: false,
          removedResultIds: [],
        }),

      markSynced: () => set({ dirty: false, removedResultIds: [] }),

      replaceImageUris: (user, results) =>
        set((state) => ({
          user: user ?? state.user,
          results,
        })),

      toSnapshot: () => {
        const s = get();
        return {
          user: s.user,
          settings: s.settings,
          results: s.results,
          xpTransactions: s.xpTransactions,
          unlockedAchievements: s.unlockedAchievements,
          updatedAt: s.user?.updatedAt ?? new Date().toISOString(),
        } satisfies AthleteSnapshot;
      },
    }),
    {
      name: 'titifit-athlete-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        isDemo: s.isDemo,
        user: s.user,
        results: s.results,
        xpTransactions: s.xpTransactions,
        unlockedAchievements: s.unlockedAchievements,
        settings: s.settings,
        dirty: s.dirty,
        removedResultIds: s.removedResultIds,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<AthleteStoreState> | undefined;
        return {
          ...state,
          settings: normalizeSettings(state?.settings),
        } as AthleteStoreState;
      },
      version: 2,
      // Screens wait on `hydrated` so nothing renders against empty state
      // while AsyncStorage is still loading.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export type { AppSettings } from './settings';
