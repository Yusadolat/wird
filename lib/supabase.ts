import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

import { createClient, processLock, type Session } from "@supabase/supabase-js";

import { config } from "./config";
import { getPersistenceStorage } from "./persistenceStorage";

export const isSupabaseConfigured = Boolean(
  config.enableSupabaseSync && config.supabaseUrl && config.supabaseAnonKey,
);

export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl as string, config.supabaseAnonKey as string, {
      auth: {
        ...(Platform.OS !== "web" ? { storage: getPersistenceStorage() } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

let hasRegisteredAppStateListener = false;
let bootstrapPromise: Promise<Session | null> | null = null;

if (supabase && Platform.OS !== "web" && !hasRegisteredAppStateListener) {
  hasRegisteredAppStateListener = true;

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
      return;
    }

    void supabase.auth.stopAutoRefresh();
  });
}

export async function ensureSupabaseSession() {
  if (!supabase) {
    return null;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (__DEV__) {
          console.log("[Supabase Auth] getSession failed", error.message);
        }
      }

      if (data.session) {
        return data.session;
      }

      const anonymousResult = await supabase.auth.signInAnonymously();

      if (anonymousResult.error) {
        if (__DEV__) {
          console.log(
            "[Supabase Auth] anonymous sign-in failed",
            anonymousResult.error.message,
          );
        }

        return null;
      }

      return anonymousResult.data.session;
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}
