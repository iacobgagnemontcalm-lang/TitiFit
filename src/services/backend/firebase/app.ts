import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { getFirebaseConfig } from './config';

/**
 * Lazy singletons. Nothing here runs unless the app actually signs in, so an
 * unconfigured build never touches the network.
 */

let app: FirebaseApp | undefined;
let auth: firebaseAuth.Auth | undefined;
let db: Firestore | undefined;

export function firebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  return app;
}

/**
 * `getReactNativePersistence` only exists on the React Native build of
 * `firebase/auth`, and the package's public types do not surface it. Reading it
 * defensively keeps web and native on one code path.
 */
function reactNativePersistence(): firebaseAuth.Persistence | undefined {
  const factory = (
    firebaseAuth as unknown as {
      getReactNativePersistence?: (storage: unknown) => firebaseAuth.Persistence;
    }
  ).getReactNativePersistence;
  return factory ? factory(AsyncStorage) : undefined;
}

export function firebaseAuthInstance(): firebaseAuth.Auth {
  if (auth) return auth;

  if (Platform.OS === 'web') {
    auth = firebaseAuth.getAuth(firebaseApp());
    return auth;
  }

  const persistence = reactNativePersistence();
  try {
    auth = firebaseAuth.initializeAuth(
      firebaseApp(),
      persistence ? { persistence } : undefined,
    );
  } catch {
    // Already initialized (fast refresh) — reuse the existing instance.
    auth = firebaseAuth.getAuth(firebaseApp());
  }
  return auth;
}

export function firestore(): Firestore {
  if (db) return db;
  try {
    // Long polling avoids the streaming-transport failures the JS SDK hits
    // behind some mobile networks and corporate proxies.
    db = initializeFirestore(firebaseApp(), {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(firebaseApp());
  }
  return db;
}
