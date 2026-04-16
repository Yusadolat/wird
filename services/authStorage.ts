import * as SecureStore from "expo-secure-store";

import type { UserSession } from "../types/wird";

const AUTH_STORAGE_KEY = "wird.auth.session";
const AUTH_PENDING_KEY = "wird.auth.pending";

type PendingAuthPayload = {
  codeVerifier: string;
};

export async function loadStoredAuthSession() {
  const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function saveStoredAuthSession(session: UserSession) {
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredAuthSession() {
  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}

export async function savePendingAuth(payload: PendingAuthPayload) {
  await SecureStore.setItemAsync(AUTH_PENDING_KEY, JSON.stringify(payload));
}

export async function loadPendingAuth() {
  const raw = await SecureStore.getItemAsync(AUTH_PENDING_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingAuthPayload;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_PENDING_KEY);
    return null;
  }
}

export async function clearPendingAuth() {
  await SecureStore.deleteItemAsync(AUTH_PENDING_KEY);
}
