import { FirebaseBackend } from './firebase/adapter';
import { isFirebaseConfigured, missingFirebaseKeys } from './firebase/config';
import { LocalBackend } from './localAdapter';
import type { BackendAdapter } from './types';

export * from './types';
export { isFirebaseConfigured, missingFirebaseKeys } from './firebase/config';

/**
 * Picks the backend once, at first use: Firebase when credentials are present,
 * the local no-op adapter otherwise. Swapping in a Supabase adapter later means
 * adding one class and one branch here.
 */
let backend: BackendAdapter | undefined;

export function getBackend(): BackendAdapter {
  if (!backend) {
    backend = isFirebaseConfigured() ? new FirebaseBackend() : new LocalBackend();
  }
  return backend;
}

/** Test seam — lets a spec inject a fake adapter. */
export function setBackend(next: BackendAdapter): void {
  backend = next;
}

export const isCloudEnabled = (): boolean => getBackend().isConfigured();

export const backendDiagnostics = () => ({
  adapter: getBackend().id,
  configured: isFirebaseConfigured(),
  missingKeys: missingFirebaseKeys(),
  /**
   * Surfaced in Settings so the athlete can confirm the *running bundle*
   * actually carries the keys. `EXPO_PUBLIC_*` values are inlined at build
   * time, and Metro caches transforms: restarting without `--clear` silently
   * keeps the previous (often empty) values, which otherwise looks like a
   * broken config.
   */
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? null,
});
