import type {
  AthleteSnapshot,
  AuthSession,
  BackendAdapter,
  PublicCard,
} from './types';
import { BackendError } from './types';

/**
 * The no-network fallback. It keeps every screen working when Firebase is not
 * configured — data still persists locally through the Zustand/AsyncStorage
 * layer, it simply never leaves the device.
 */
export class LocalBackend implements BackendAdapter {
  readonly id = 'local';

  isConfigured(): boolean {
    return false;
  }

  getSession(): AuthSession | null {
    return null;
  }

  observeSession(listener: (session: AuthSession | null) => void): () => void {
    listener(null);
    return () => undefined;
  }

  private unavailable(): never {
    throw new BackendError(
      'Aucun backend configuré. Ajoute tes clés Firebase pour créer un compte.',
      'backend/not-configured',
    );
  }

  async signUp(): Promise<AuthSession> {
    this.unavailable();
  }

  async signIn(): Promise<AuthSession> {
    this.unavailable();
  }

  async signInAnonymously(): Promise<AuthSession> {
    this.unavailable();
  }

  async signOut(): Promise<void> {
    // Nothing to do — there was never a session.
  }

  async sendPasswordReset(): Promise<void> {
    this.unavailable();
  }

  async pull(): Promise<AthleteSnapshot | null> {
    return null;
  }

  async push(): Promise<void> {
    // Local-only: the Zustand persist middleware already wrote to disk.
  }

  async publishCard(): Promise<void> {
    // No public surface without a backend.
  }

  async fetchLeaderboard(): Promise<PublicCard[]> {
    return [];
  }

  /** No remote storage: the local path is the best we have. */
  async uploadImage(_uid: string, localUri: string): Promise<string> {
    return localUri;
  }
}
