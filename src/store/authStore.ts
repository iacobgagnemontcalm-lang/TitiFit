import { create } from 'zustand';

import { getBackend } from '@/services/backend';
import type { AuthSession, SyncState } from '@/services/backend/types';

interface AuthStoreState {
  /** Null until the backend reports its first auth state. */
  session: AuthSession | null;
  /** False until `observeSession` has fired once. */
  resolved: boolean;
  cloudEnabled: boolean;
  sync: SyncState;
  busy: boolean;
  error: string | null;
}

interface AuthStoreActions {
  setSession: (session: AuthSession | null) => void;
  setSync: (sync: Partial<SyncState>) => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreState & AuthStoreActions>()((set) => ({
  session: null,
  resolved: false,
  cloudEnabled: getBackend().isConfigured(),
  sync: { status: getBackend().isConfigured() ? 'signed-out' : 'local' },
  busy: false,
  error: null,

  setSession: (session) =>
    set((state) => ({
      session,
      resolved: true,
      sync: {
        ...state.sync,
        status: session ? 'idle' : state.cloudEnabled ? 'signed-out' : 'local',
      },
    })),

  setSync: (sync) => set((state) => ({ sync: { ...state.sync, ...sync } })),
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error }),
}));

export const syncLabel = (sync: SyncState): string => {
  switch (sync.status) {
    case 'local':
      return 'Mode local — aucune synchronisation';
    case 'signed-out':
      return 'Non connecté';
    case 'syncing':
      return 'Synchronisation…';
    case 'error':
      return sync.error ?? 'Erreur de synchronisation';
    case 'idle':
    default:
      return sync.lastSyncedAt ? 'Synchronisé' : 'Prêt à synchroniser';
  }
};
