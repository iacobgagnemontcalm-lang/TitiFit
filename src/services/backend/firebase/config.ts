/**
 * Firebase credentials are read from `EXPO_PUBLIC_*` environment variables, so
 * they are inlined at build time and never committed. Copy `.env.example` to
 * `.env.local` and fill it in.
 *
 * When the variables are absent, `isFirebaseConfigured()` returns false and the
 * whole app falls back to the local-only backend — the prototype still runs,
 * it just does not sync.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const raw = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];

export function isFirebaseConfigured(): boolean {
  return REQUIRED.every((key) => {
    const value = raw[key];
    return typeof value === 'string' && value.length > 0;
  });
}

export function getFirebaseConfig(): FirebaseConfig {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured — check your EXPO_PUBLIC_FIREBASE_* variables.');
  }
  return {
    apiKey: raw.apiKey ?? '',
    authDomain: raw.authDomain ?? '',
    projectId: raw.projectId ?? '',
    storageBucket: raw.storageBucket ?? '',
    messagingSenderId: raw.messagingSenderId ?? '',
    appId: raw.appId ?? '',
  };
}

/** Names of the variables still missing, for the Settings diagnostics panel. */
export function missingFirebaseKeys(): string[] {
  return REQUIRED.filter((key) => !raw[key]).map(
    (key) => `EXPO_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`,
  );
}
