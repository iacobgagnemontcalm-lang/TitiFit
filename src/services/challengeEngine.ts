import { CHALLENGES } from '@/data/challenges';
import { OFFICIAL_TEST_IDS, TEST_DISTANCE_METRES } from '@/data/tests';
import type { Challenge, ChallengeGoal, ChallengeProgress, TestResult } from '@/types';
import { todayISO } from '@/utils/date';
import { clamp, mean } from '@/utils/math';

function goalProgress(goal: ChallengeGoal, results: TestResult[]): number {
  switch (goal.kind) {
    case 'workouts':
      return clamp(results.length / goal.target, 0, 1);
    case 'distance_metres': {
      const metres = results.reduce((s, r) => s + (TEST_DISTANCE_METRES[r.testId] ?? 0), 0);
      return clamp(metres / goal.target, 0, 1);
    }
    case 'reps': {
      const reps = results
        .filter((r) => r.testId === goal.testId)
        .reduce((s, r) => s + (r.raw.count ?? r.metricValue), 0);
      return clamp(reps / goal.target, 0, 1);
    }
    case 'tests_completed': {
      const done = new Set(
        results.filter((r) => OFFICIAL_TEST_IDS.includes(r.testId as never)).map((r) => r.testId),
      ).size;
      return clamp(done / goal.target, 0, 1);
    }
    default:
      return 0;
  }
}

export function calculateChallengeProgress(
  challenge: Challenge,
  results: TestResult[],
): ChallengeProgress {
  const inWindow = results.filter(
    (r) => r.date >= challenge.startDate && r.date <= challenge.endDate,
  );
  const goals = challenge.goals.map((g) => goalProgress(g, inWindow));
  const progress = goals.length ? mean(goals) : 0;
  return { challenge, goalProgress: goals, progress, completed: progress >= 1 };
}

export function activeChallenges(
  results: TestResult[],
  today: string = todayISO(),
): ChallengeProgress[] {
  return CHALLENGES.filter((c) => c.startDate <= today && c.endDate >= today).map((c) =>
    calculateChallengeProgress(c, results),
  );
}

export function goalLabel(goal: ChallengeGoal): string {
  switch (goal.kind) {
    case 'workouts':
      return `${goal.target} entraînements`;
    case 'distance_metres':
      return `${Math.round(goal.target / 1000)} km de course`;
    case 'reps':
      return `${goal.target} répétitions`;
    case 'tests_completed':
      return `${goal.target} tests officiels`;
    default:
      return '';
  }
}
