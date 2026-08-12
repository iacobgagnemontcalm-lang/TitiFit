import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEMO_USER, buildDemoResults } from '@/data/mock/demoAthlete';
import type {
  BeerSettings,
  StreakConfig,
  TestResult,
  UnlockedAchievement,
  User,
  XPTransaction,
} from '@/types';
import { todayISO } from '@/utils/date';

import {
  processAddResult,
  unlockedFromAchievements,
  type AddResultInput,
  type AddResultOutcome,
} from '@/services/addResultFlow';
import { computeAthleteState } from '@/services/athleteService';
import { DEFAULT_BEER_SETTINGS } from '@/services/beerEngine';
import { DEFAULT_STREAK_CONFIG } from '@/services/streakEngine';

/**
 * Single source of truth for everything the athlete *entered*. Nothing derived
 * is stored — ratings, XP totals, streaks and achievements are recomputed from
 * these primitives (see `useAthlete`), which keeps the state trivially
 * migratable to a real backend later.
 */

export interface AppSettings {
  beer: BeerSettings;
  streak: StreakConfig;
  /** Hides Beer Earned everywhere, per spec. */
  hideBeerEarned: boolean;
  showSimulatedBadges: boolean;
}

interface AthleteStoreState {
  hydrated: boolean;
  onboarded: boolean;
  user: User | null;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  unlockedAchievements: UnlockedAchievement[];
  settings: AppSettings;
  /** Outcome of the most recent ADD RESULT, consumed by the summary screen. */
  lastOutcome: AddResultOutcome | null;
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
}

export type AthleteStore = AthleteStoreState & AthleteStoreActions;

const DEFAULT_SETTINGS: AppSettings = {
  beer: DEFAULT_BEER_SETTINGS,
  streak: DEFAULT_STREAK_CONFIG,
  hideBeerEarned: false,
  showSimulatedBadges: true,
};

const EMPTY_STATE: AthleteStoreState = {
  hydrated: false,
  onboarded: false,
  user: null,
  results: [],
  xpTransactions: [],
  unlockedAchievements: [],
  settings: DEFAULT_SETTINGS,
  lastOutcome: null,
};

export const useAthleteStore = create<AthleteStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      setHydrated: () => set({ hydrated: true }),

      completeOnboarding: (user) => set({ user, onboarded: true }),

      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),

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
        });

        return outcome;
      },

      deleteResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
          xpTransactions: state.xpTransactions.filter((t) => t.sourceId !== id),
        })),

      clearLastOutcome: () => set({ lastOutcome: null }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      /**
       * Seeds the demo athlete. XP is granted retroactively so the level shown
       * matches the seeded history instead of starting at zero.
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
        // Lands the demo athlete at level 16 with ~15 450 / 20 100 XP, which
        // is the level a two-month history at this volume should be worth.
        xpTransactions.push({
          id: 'xp_demo_bonus',
          amount: 138_550,
          reason: 'achievement_unlocked',
          label: 'Progression cumulée',
          date: todayISO(),
        });

        // Achievements the seeded history already earned are unlocked up
        // front — otherwise the athlete's first real result would dump twenty
        // of them at once.
        const seeded = computeAthleteState({
          user: DEMO_USER,
          results,
          xpTransactions,
          unlockedAchievements: [],
          beerSettings: get().settings.beer,
          streakConfig: get().settings.streak,
        });
        const lastDate = results[results.length - 1]?.date ?? todayISO();
        const unlockedAchievements = seeded.achievements
          .filter((a) => a.unlocked)
          .map((a) => ({ achievementId: a.achievement.id, date: lastDate }));

        set({
          user: DEMO_USER,
          onboarded: true,
          results,
          xpTransactions,
          unlockedAchievements,
          lastOutcome: null,
        });
      },

      resetAll: () => set({ ...EMPTY_STATE, hydrated: true }),
    }),
    {
      name: 'titifit-athlete-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ onboarded, user, results, xpTransactions, unlockedAchievements, settings }) => ({
        onboarded,
        user,
        results,
        xpTransactions,
        unlockedAchievements,
        settings,
      }),
      // Screens wait on `hydrated` so nothing renders against empty state
      // while AsyncStorage is still loading.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
