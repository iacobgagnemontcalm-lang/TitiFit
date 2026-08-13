import type { TestId } from '@/types';

/**
 * HEALTH IMPORTS — Apple Health, Garmin, Strava.
 *
 * The product decision that shapes this layer: TitiFit is **not** another
 * workout tracker. We do not want to own the logging of every run — we want to
 * read what those apps already recorded and feed it into the rating system.
 *
 * So a provider's only job is to hand back *candidate results*: an activity
 * that plausibly matches one of our official tests, which the athlete then
 * confirms. Nothing is ever imported silently — an auto-imported 5 km that was
 * actually a warm-up jog would corrupt a rating the athlete trusts.
 */

export type IntegrationId = 'apple_health' | 'garmin' | 'strava';

export type IntegrationStatus =
  | 'unavailable' // not supported on this platform/build
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface ImportedActivity {
  /** Provider-scoped id, used to avoid importing the same activity twice. */
  externalId: string;
  provider: IntegrationId;
  date: string;
  /** Which official test this could populate, when we can tell. */
  suggestedTestId?: TestId;
  distanceMetres?: number;
  durationSeconds?: number;
  calories?: number;
  name: string;
  /** 0–1: how confident the mapping is. Below ~0.8 we ask before suggesting. */
  confidence: number;
}

export interface IntegrationProvider {
  readonly id: IntegrationId;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  /** Why it is not usable yet, when applicable. */
  readonly requirement?: string;

  status(): Promise<IntegrationStatus>;
  connect(): Promise<IntegrationStatus>;
  disconnect(): Promise<void>;
  /** Activities since `since`, already mapped to candidate tests. */
  fetchActivities(since: string): Promise<ImportedActivity[]>;
}

/**
 * Maps a distance to the official test it could feed, with a tolerance —
 * a GPS 5 km is rarely exactly 5000 m.
 */
export function matchTestByDistance(metres: number): { testId: TestId; confidence: number } | null {
  const targets: { testId: TestId; metres: number }[] = [
    { testId: 'run_400m', metres: 400 },
    { testId: 'run_5k', metres: 5000 },
    { testId: 'run_100m', metres: 100 },
    { testId: 'run_300m', metres: 300 },
    { testId: 'run_1600m', metres: 1609.344 },
    { testId: 'run_10k', metres: 10000 },
  ];

  for (const target of targets) {
    const error = Math.abs(metres - target.metres) / target.metres;
    if (error <= 0.03) return { testId: target.testId, confidence: 1 - error / 0.03 };
  }
  return null;
}
