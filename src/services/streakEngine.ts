import type { StreakConfig, StreakState, TestResult } from '@/types';
import { todayISO, weekKey, weeksBetweenKeys } from '@/utils/date';

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  activitiesPerWeek: 2,
  weekStartsOn: 1,
};

/**
 * A "week active" = at least `activitiesPerWeek` logged results inside the same
 * calendar week. The threshold is config, not a constant, so it can be tuned
 * per-user (or per-experience-level) later.
 */
export function calculateStreak(
  results: TestResult[],
  config: StreakConfig = DEFAULT_STREAK_CONFIG,
  today: string = todayISO(),
): StreakState {
  const counts = new Map<string, number>();
  for (const r of results) {
    const key = weekKey(r.date, config.weekStartsOn);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const currentWeek = weekKey(today, config.weekStartsOn);
  const activitiesThisWeek = counts.get(currentWeek) ?? 0;
  const weekSecured = activitiesThisWeek >= config.activitiesPerWeek;

  const activeWeeks = [...counts.entries()]
    .filter(([, n]) => n >= config.activitiesPerWeek)
    .map(([key]) => key)
    .sort();

  // Longest run of consecutive active weeks.
  let longest = 0;
  let run = 0;
  for (let i = 0; i < activeWeeks.length; i += 1) {
    const prev = activeWeeks[i - 1];
    const key = activeWeeks[i]!;
    run = prev && weeksBetweenKeys(prev, key) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // Current streak walks backwards from this week (or last week if this week
  // is still in progress — an unfinished week must not break the streak).
  let current = 0;
  let cursor = weekSecured ? currentWeek : previousWeek(currentWeek);
  const activeSet = new Set(activeWeeks);
  while (activeSet.has(cursor)) {
    current += 1;
    cursor = previousWeek(cursor);
  }

  return {
    current,
    longest: Math.max(longest, current),
    activitiesThisWeek,
    activitiesNeeded: Math.max(0, config.activitiesPerWeek - activitiesThisWeek),
    weekSecured,
    lastActiveWeek: activeWeeks[activeWeeks.length - 1],
  };
}

function previousWeek(key: string): string {
  const [yearStr, weekStr] = key.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (week > 1) return `${year}-W${(week - 1).toString().padStart(2, '0')}`;
  return `${year - 1}-W52`;
}

export function streakMessage(state: StreakState): string {
  if (state.weekSecured) {
    return state.current > 1
      ? `Semaine sécurisée. ${state.current} semaines d'affilée. 🔥`
      : 'Semaine sécurisée. La série commence. 🔥';
  }
  if (state.activitiesNeeded === 1) {
    return 'Encore 1 entraînement cette semaine pour conserver ta série.';
  }
  return `Encore ${state.activitiesNeeded} entraînements cette semaine pour conserver ta série.`;
}
