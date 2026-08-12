import { ACHIEVEMENTS } from '@/data/achievements';
import { OFFICIAL_TEST_IDS, TESTS } from '@/data/tests';
import type {
  Achievement,
  AchievementCondition,
  AchievementProgress,
  CategoryId,
  CategoryRating,
  PersonalRecord,
  TestId,
  UnlockedAchievement,
} from '@/types';
import { formatDuration } from '@/utils/units';
import { clamp } from '@/utils/math';

/** Everything the declarative conditions can be evaluated against. */
export interface AchievementContext {
  bests: Partial<Record<TestId, PersonalRecord>>;
  categories: Record<CategoryId, CategoryRating>;
  overall: number | null;
  streakWeeks: number;
  totalResults: number;
  beersAllTime: number;
  bodyWeightKg: number;
}

interface Evaluation {
  met: boolean;
  progress: number;
  label?: string;
}

function evaluate(condition: AchievementCondition, ctx: AchievementContext): Evaluation {
  switch (condition.kind) {
    case 'bodyweight_multiple': {
      const best = ctx.bests[condition.testId];
      if (!best) return { met: false, progress: 0, label: `0 / ${condition.multiple}× BW` };
      const ratio = best.metricValue / Math.max(1, ctx.bodyWeightKg);
      return {
        met: ratio >= condition.multiple,
        progress: clamp(ratio / condition.multiple, 0, 1),
        label: `${ratio.toFixed(2)}× / ${condition.multiple}× BW`,
      };
    }
    case 'metric_at_least': {
      const best = ctx.bests[condition.testId];
      const value = best?.metricValue ?? 0;
      return {
        met: value >= condition.value,
        progress: clamp(value / condition.value, 0, 1),
        label: `${Math.round(value)} / ${condition.value}`,
      };
    }
    case 'metric_at_most': {
      const best = ctx.bests[condition.testId];
      if (!best) return { met: false, progress: 0, label: 'Non testé' };
      const isTime = TESTS[condition.testId].unit === 'seconds';
      // Progress is measured on how much of the remaining gap is closed,
      // starting from 1.5× the target (an honest "starting line").
      const start = condition.value * 1.5;
      const progress = clamp(
        (start - best.metricValue) / (start - condition.value),
        0,
        1,
      );
      return {
        met: best.metricValue <= condition.value,
        progress,
        label: isTime
          ? `${formatDuration(best.metricValue)} / ${formatDuration(condition.value)}`
          : `${Math.round(best.metricValue)} / ${condition.value}`,
      };
    }
    case 'rating_at_least': {
      const rating = ctx.categories[condition.categoryId]?.rating ?? 0;
      return {
        met: rating >= condition.rating,
        progress: clamp(rating / condition.rating, 0, 1),
        label: `${Math.round(rating)} / ${condition.rating}`,
      };
    }
    case 'overall_at_least': {
      const overall = ctx.overall ?? 0;
      return {
        met: overall >= condition.rating,
        progress: clamp(overall / condition.rating, 0, 1),
        label: `${Math.round(overall)} / ${condition.rating} OVR`,
      };
    }
    case 'streak_weeks':
      return {
        met: ctx.streakWeeks >= condition.weeks,
        progress: clamp(ctx.streakWeeks / condition.weeks, 0, 1),
        label: `${ctx.streakWeeks} / ${condition.weeks} sem.`,
      };
    case 'total_results':
      return {
        met: ctx.totalResults >= condition.count,
        progress: clamp(ctx.totalResults / condition.count, 0, 1),
        label: `${ctx.totalResults} / ${condition.count}`,
      };
    case 'all_tests_completed': {
      const done = OFFICIAL_TEST_IDS.filter((id) => ctx.bests[id] != null).length;
      return {
        met: done === OFFICIAL_TEST_IDS.length,
        progress: done / OFFICIAL_TEST_IDS.length,
        label: `${done} / ${OFFICIAL_TEST_IDS.length} tests`,
      };
    }
    case 'beers_earned':
      return {
        met: ctx.beersAllTime >= condition.beers,
        progress: clamp(ctx.beersAllTime / condition.beers, 0, 1),
        label: `${Math.floor(ctx.beersAllTime)} / ${condition.beers} 🍺`,
      };
    default:
      return { met: false, progress: 0 };
  }
}

export function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: UnlockedAchievement[],
): AchievementProgress[] {
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.date]));

  return ACHIEVEMENTS.map((achievement) => {
    const result = evaluate(achievement.condition, ctx);
    const already = unlockedMap.get(achievement.id);
    return {
      achievement,
      unlocked: already != null || result.met,
      unlockedAt: already,
      progress: already != null ? 1 : result.progress,
      progressLabel: result.label,
    } satisfies AchievementProgress;
  });
}

/** Achievements newly satisfied that are not yet in `unlocked`. */
export function findNewlyUnlocked(
  ctx: AchievementContext,
  unlocked: UnlockedAchievement[],
): Achievement[] {
  const known = new Set(unlocked.map((u) => u.achievementId));
  return ACHIEVEMENTS.filter((a) => !known.has(a.id) && evaluate(a.condition, ctx).met);
}

/** Highest-value unlocked achievement — the one shown on the athlete card. */
export function bestAchievement(
  unlocked: UnlockedAchievement[],
): Achievement | undefined {
  const known = new Set(unlocked.map((u) => u.achievementId));
  return ACHIEVEMENTS.filter((a) => known.has(a.id)).sort((a, b) => b.xp - a.xp)[0];
}
