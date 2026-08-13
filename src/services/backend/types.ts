import type {
  AthleteTypeId,
  CardTier,
  CategoryId,
  TestResult,
  UnlockedAchievement,
  User,
  XPTransaction,
} from '@/types';
import type { AppSettings } from '@/store/settings';

/** An authenticated session, backend-agnostic. */
export interface AuthSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

/** Everything an athlete owns, as stored remotely. */
export interface AthleteSnapshot {
  user: User | null;
  settings: AppSettings | null;
  results: TestResult[];
  xpTransactions: XPTransaction[];
  unlockedAchievements: UnlockedAchievement[];
  updatedAt: string;
}

/**
 * The denormalized public projection of an athlete, written on every sync.
 * Leaderboards and Athlete VS read this instead of the private documents.
 */
export interface PublicCard {
  uid: string;
  username: string;
  displayName: string;
  avatarUri?: string;
  overall: number | null;
  percentile: number | null;
  tier: CardTier;
  athleteType: AthleteTypeId;
  level: number;
  categories: Record<CategoryId, number | null>;
  sex: string;
  age: number;
  bodyWeightKg: number;
  country?: string;
  region?: string;
  city?: string;
  updatedAt: string;
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly code: string = 'unknown',
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

/**
 * The single seam between TitiFit and any backend. `LocalBackend` implements it
 * with no network at all; `FirebaseBackend` implements it with Auth + Firestore.
 * Nothing above this interface knows which one is active.
 */
export interface BackendAdapter {
  readonly id: string;
  /** False when the backend has no credentials — the app then runs local-only. */
  isConfigured(): boolean;

  observeSession(listener: (session: AuthSession | null) => void): () => void;
  getSession(): AuthSession | null;

  signUp(email: string, password: string, displayName: string): Promise<AuthSession>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signInAnonymously(): Promise<AuthSession>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;

  pull(uid: string): Promise<AthleteSnapshot | null>;
  /** Writes only what changed; `removedResultIds` deletes server-side. */
  push(
    uid: string,
    snapshot: AthleteSnapshot,
    options?: { removedResultIds?: string[] },
  ): Promise<void>;
  publishCard(card: PublicCard): Promise<void>;
  fetchLeaderboard(limit?: number): Promise<PublicCard[]>;

  /**
   * Uploads a local image (`file://…`) and returns a durable URL.
   * Implementations MUST return the input unchanged when they cannot store
   * anything, so callers can always assign the result back.
   */
  uploadImage(uid: string, localUri: string, path: string): Promise<string>;
}

/** True for a device-local path that would not survive on another device. */
export const isLocalUri = (uri?: string): boolean =>
  uri != null && !/^https?:\/\//.test(uri);

export type SyncStatus = 'local' | 'idle' | 'syncing' | 'error' | 'signed-out';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  error?: string;
}
