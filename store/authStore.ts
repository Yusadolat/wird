import { create } from "zustand";

import { config } from "../lib/config";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession,
} from "../services/authStorage";
import {
  refreshQuranSession,
  shouldRefreshQuranSession,
} from "../services/quranAuthService";
import type { UserSession } from "../types/wird";

type AuthStore = UserSession & {
  authError: string | null;
  isAuthenticating: boolean;
  isHydrated: boolean;
  setSession: (session: Partial<UserSession>) => void;
  setAuthError: (message: string | null) => void;
  setAuthenticating: (value: boolean) => void;
  refreshSession: (options?: { force?: boolean }) => Promise<UserSession | null>;
  hydrateSession: () => Promise<void>;
  finishSignIn: (session: UserSession) => Promise<void>;
  continueAsGuest: () => void;
  clearSession: () => Promise<void>;
};

const initialState: UserSession = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  tokenExpiresAt: null,
  userId: null,
  displayName: null,
  email: null,
  isGuest: false,
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  ...initialState,
  authError: null,
  isAuthenticating: false,
  isHydrated: false,
  setSession: (session) => set((state) => ({ ...state, ...session })),
  setAuthError: (authError) => set({ authError }),
  setAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  refreshSession: async (options) => {
    const current = get();

    if (current.isGuest || !current.refreshToken) {
      return current.isGuest ? current : null;
    }

    if (!options?.force && !shouldRefreshQuranSession(current)) {
      return current;
    }

    try {
      const nextSession = await refreshQuranSession(current);

      if (!nextSession) {
        await clearStoredAuthSession();
        set({
          ...initialState,
          authError: "Your Quran.com session expired. Please sign in again.",
          isAuthenticating: false,
          isHydrated: true,
        });
        return null;
      }

      await saveStoredAuthSession(nextSession);
      set({
        ...nextSession,
        authError: null,
        isAuthenticating: false,
        isHydrated: true,
      });

      return nextSession;
    } catch {
      await clearStoredAuthSession();
      set({
        ...initialState,
        authError: "Your Quran.com session expired. Please sign in again.",
        isAuthenticating: false,
        isHydrated: true,
      });
      return null;
    }
  },
  hydrateSession: async () => {
    if (config.skipQuranAuth) {
      set({
        ...initialState,
        authError: null,
        isAuthenticating: false,
        isHydrated: true,
        isGuest: true,
      });
      return;
    }

    try {
      const storedSession = await loadStoredAuthSession();

      if (!storedSession) {
        set({ ...initialState, authError: null, isAuthenticating: false, isHydrated: true });
        return;
      }

      const nextSession = shouldRefreshQuranSession(storedSession)
        ? await refreshQuranSession(storedSession)
        : storedSession;

      if (!nextSession) {
        await clearStoredAuthSession();
        set({ ...initialState, authError: null, isAuthenticating: false, isHydrated: true });
        return;
      }

      await saveStoredAuthSession(nextSession);
      set({
        ...nextSession,
        authError: null,
        isAuthenticating: false,
        isHydrated: true,
      });
    } catch {
      await clearStoredAuthSession();
      set({
        ...initialState,
        authError: "Unable to restore Quran.com session.",
        isAuthenticating: false,
        isHydrated: true,
      });
    }
  },
  finishSignIn: async (session) => {
    await saveStoredAuthSession(session);
    set({
      ...session,
      authError: null,
      isAuthenticating: false,
      isHydrated: true,
    });
  },
  continueAsGuest: () => {
    const guestSession: UserSession = {
      ...initialState,
      isGuest: true,
    };

    void saveStoredAuthSession(guestSession);

    set({
      ...guestSession,
      authError: null,
      isAuthenticating: false,
      isHydrated: true,
    });
  },
  clearSession: async () => {
    await clearStoredAuthSession();
    set({
      ...initialState,
      authError: null,
      isAuthenticating: false,
      isHydrated: true,
    });
  },
}));
