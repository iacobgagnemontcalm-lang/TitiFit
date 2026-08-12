import type { LevelState, XPReason, XPTransaction } from '@/types';
import { createId } from '@/utils/id';
import { clamp, roundTo } from '@/utils/math';

/**
 * XP curve: `xpForLevel(L) = round100(475 · L^1.35)`.
 * Smooth, super-linear, and calibrated so level 16 costs 20 000 XP — which
 * keeps the numbers in the spec's examples honest. Tunable in one place.
 */
export function xpForLevel(level: number): number {
  return Math.max(500, roundTo(475 * Math.max(1, level) ** 1.35, 100));
}

export function levelFromTotalXP(totalXP: number): LevelState {
  let level = 1;
  let remaining = Math.max(0, totalXP);

  while (remaining >= xpForLevel(level) && level < 999) {
    remaining -= xpForLevel(level);
    level += 1;
  }

  const xpForCurrent = xpForLevel(level);
  return {
    level,
    totalXP,
    xpIntoLevel: Math.round(remaining),
    xpForLevel: xpForCurrent,
    progress: clamp(remaining / xpForCurrent, 0, 1),
  };
}

/** Cumulative XP required to *reach* a level. */
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l += 1) total += xpForLevel(l);
  return total;
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export const XP_REWARDS: Record<XPReason, number> = {
  result_logged: 50,
  personal_record: 100,
  big_improvement: 200,
  first_time_test: 150,
  all_tests_complete: 500,
  streak_week: 75,
  challenge_complete: 500,
  achievement_unlocked: 150,
  tier_upgrade: 300,
};

export interface XPRewardInput {
  isPR: boolean;
  isFirstTimeTest: boolean;
  /** Percentile gained vs the previous best. */
  percentileDelta: number;
  completesAllTests: boolean;
}

export interface XPRewardBreakdown {
  total: number;
  lines: { reason: XPReason; label: string; amount: number }[];
}

/**
 * Every logged result is worth something; PRs and real jumps in percentile are
 * worth a lot more. `big_improvement` scales with the size of the jump so a
 * +1 percentile PR does not pay the same as +12.
 */
export function calculateXPReward(input: XPRewardInput): XPRewardBreakdown {
  const lines: XPRewardBreakdown['lines'] = [
    { reason: 'result_logged', label: 'Résultat enregistré', amount: XP_REWARDS.result_logged },
  ];

  if (input.isFirstTimeTest) {
    lines.push({
      reason: 'first_time_test',
      label: 'Premier test complété',
      amount: XP_REWARDS.first_time_test,
    });
  }

  if (input.isPR && !input.isFirstTimeTest) {
    lines.push({
      reason: 'personal_record',
      label: 'Nouveau record personnel',
      amount: XP_REWARDS.personal_record,
    });
  }

  if (input.percentileDelta >= 2) {
    // 2 pts -> ~33 XP, 12+ pts -> capped at 200 XP.
    const amount = Math.round(clamp(input.percentileDelta * 16.7, 0, XP_REWARDS.big_improvement));
    lines.push({ reason: 'big_improvement', label: 'Bond de percentile', amount });
  }

  if (input.completesAllTests) {
    lines.push({
      reason: 'all_tests_complete',
      label: 'Profil athlétique complet',
      amount: XP_REWARDS.all_tests_complete,
    });
  }

  return { total: lines.reduce((s, l) => s + l.amount, 0), lines };
}

export function createXPTransaction(
  amount: number,
  reason: XPReason,
  label: string,
  date: string,
  sourceId?: string,
): XPTransaction {
  return { id: createId('xp'), amount, reason, label, date, sourceId };
}
