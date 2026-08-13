import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously as fbSignInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import type { TestResult, UnlockedAchievement, User, XPTransaction } from '@/types';
import { normalizeSettings } from '@/store/settings';

import type {
  AthleteSnapshot,
  AuthSession,
  BackendAdapter,
  PublicCard,
} from '../types';
import { BackendError } from '../types';
import { isFirebaseConfigured } from './config';
import { firebaseAuthInstance, firebaseStorage, firestore } from './app';

/**
 * Firestore layout
 * ----------------
 *   users/{uid}                      profile + settings + updatedAt
 *   users/{uid}/results/{resultId}   one doc per logged result
 *   users/{uid}/xp/{txId}            one doc per XP transaction
 *   users/{uid}/achievements/{id}    one doc per unlocked achievement
 *   publicCards/{uid}                denormalized card for leaderboards
 *
 * Subcollections (rather than one fat document) keep writes incremental and
 * keep the app under the 1 MB per-document limit no matter how long the
 * athlete's history gets.
 */

const toSession = (user: FirebaseUser): AuthSession => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  isAnonymous: user.isAnonymous,
});

/** Firestore rejects `undefined`; strip those keys before every write. */
function clean<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

function mapAuthError(error: unknown): BackendError {
  const code = (error as { code?: string })?.code ?? 'unknown';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse est déjà utilisée.',
    'auth/invalid-email': 'Adresse courriel invalide.',
    'auth/weak-password': 'Mot de passe trop faible (minimum 6 caractères).',
    'auth/user-not-found': 'Aucun compte avec cette adresse.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Courriel ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
    'auth/network-request-failed': 'Connexion impossible. Vérifie ton réseau.',
    'auth/operation-not-allowed':
      'Cette méthode de connexion n’est pas activée dans la console Firebase.',
  };
  return new BackendError(messages[code] ?? 'Une erreur est survenue. Réessaie.', code);
}

export class FirebaseBackend implements BackendAdapter {
  readonly id = 'firebase';

  private session: AuthSession | null = null;

  isConfigured(): boolean {
    return isFirebaseConfigured();
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  observeSession(listener: (session: AuthSession | null) => void): () => void {
    if (!this.isConfigured()) {
      listener(null);
      return () => undefined;
    }
    return onAuthStateChanged(firebaseAuthInstance(), (user) => {
      this.session = user ? toSession(user) : null;
      listener(this.session);
    });
  }

  // --- Auth ---------------------------------------------------------------

  async signUp(email: string, password: string, displayName: string): Promise<AuthSession> {
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuthInstance(),
        email.trim(),
        password,
      );
      if (displayName) await updateProfile(credential.user, { displayName });
      this.session = toSession(credential.user);
      return this.session;
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuthInstance(),
        email.trim(),
        password,
      );
      this.session = toSession(credential.user);
      return this.session;
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signInAnonymously(): Promise<AuthSession> {
    try {
      const credential = await fbSignInAnonymously(firebaseAuthInstance());
      this.session = toSession(credential.user);
      return this.session;
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    await fbSignOut(firebaseAuthInstance());
    this.session = null;
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(firebaseAuthInstance(), email.trim());
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  // --- Data ---------------------------------------------------------------

  async pull(uid: string): Promise<AthleteSnapshot | null> {
    const db = firestore();
    const rootRef = doc(db, 'users', uid);
    const root = await getDoc(rootRef);
    if (!root.exists()) return null;

    const data = root.data() as {
      profile?: User;
      settings?: unknown;
      updatedAt?: string;
    };

    const [results, xp, achievements] = await Promise.all([
      getDocs(collection(rootRef, 'results')),
      getDocs(collection(rootRef, 'xp')),
      getDocs(collection(rootRef, 'achievements')),
    ]);

    return {
      user: data.profile ?? null,
      settings: data.settings ? normalizeSettings(data.settings) : null,
      results: results.docs.map((d) => d.data() as TestResult),
      xpTransactions: xp.docs.map((d) => d.data() as XPTransaction),
      unlockedAchievements: achievements.docs.map((d) => d.data() as UnlockedAchievement),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  /**
   * Writes the profile document plus any subcollection entry the server does
   * not have yet. Existing docs are overwritten with `merge`, so a re-sync is
   * idempotent and never duplicates history.
   */
  async push(
    uid: string,
    snapshot: AthleteSnapshot,
    options?: { removedResultIds?: string[] },
  ): Promise<void> {
    const db = firestore();
    const rootRef = doc(db, 'users', uid);

    await setDoc(
      rootRef,
      clean({
        profile: snapshot.user ? clean(snapshot.user) : null,
        settings: snapshot.settings,
        updatedAt: snapshot.updatedAt,
        syncedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    // Firestore caps a batch at 500 writes.
    const writes: { path: string; id: string; value: object }[] = [
      ...snapshot.results.map((r) => ({ path: 'results', id: r.id, value: clean(r) })),
      ...snapshot.xpTransactions.map((t) => ({ path: 'xp', id: t.id, value: clean(t) })),
      ...snapshot.unlockedAchievements.map((a) => ({
        path: 'achievements',
        id: a.achievementId,
        value: clean(a),
      })),
    ];

    for (let i = 0; i < writes.length; i += 400) {
      const batch = writeBatch(db);
      for (const w of writes.slice(i, i + 400)) {
        batch.set(doc(rootRef, w.path, w.id), w.value, { merge: true });
      }
      await batch.commit();
    }

    for (const id of options?.removedResultIds ?? []) {
      await deleteDoc(doc(rootRef, 'results', id)).catch(() => undefined);
    }
  }

  async publishCard(card: PublicCard): Promise<void> {
    await setDoc(doc(firestore(), 'publicCards', card.uid), clean(card), { merge: true });
  }

  /**
   * Reads the local file into a blob and stores it under
   * `users/{uid}/{path}`. Returns the input untouched on failure — an image
   * that will not upload must never block a sync of the athlete's actual data.
   */
  async uploadImage(uid: string, localUri: string, path: string): Promise<string> {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const objectRef = ref(firebaseStorage(), `users/${uid}/${path}`);
      await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
      return await getDownloadURL(objectRef);
    } catch {
      return localUri;
    }
  }

  async fetchLeaderboard(max = 50): Promise<PublicCard[]> {
    const snapshot = await getDocs(
      query(collection(firestore(), 'publicCards'), orderBy('overall', 'desc'), fsLimit(max)),
    );
    return snapshot.docs.map((d) => d.data() as PublicCard);
  }
}
