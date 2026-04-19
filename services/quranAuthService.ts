import * as Crypto from "expo-crypto";

import { config } from "../lib/config";
import {
  buildQuranAuthDebugInfo,
  buildQuranRedirectUri,
  getQuranAuthConfig,
  getQuranAuthScopes,
} from "../lib/quranAuth";
import { supabase } from "../lib/supabase";
import type { UserSession } from "../types/wird";

const quranAuthConfig = getQuranAuthConfig({
  oauthRedirectScheme: config.oauthRedirectScheme,
  useProduction: config.useProduction,
  preliveClientId: config.qfPreliveClientId,
  productionClientId: config.qfProductionClientId,
  preliveBaseUrl: config.qfPreliveOauthBaseUrl,
  productionBaseUrl: config.qfProductionOauthBaseUrl,
});

export const quranDiscovery = quranAuthConfig.discovery;

export function getQuranRedirectUri() {
  if (config.oauthRedirectUri) {
    return config.oauthRedirectUri;
  }

  return buildQuranRedirectUri(config.oauthRedirectScheme);
}

export function getQuranClientId() {
  return quranAuthConfig.clientId;
}

export function getQuranScopes() {
  return getQuranAuthScopes();
}

export function getQuranAuthDebugInfo() {
  return buildQuranAuthDebugInfo({
    clientId: getQuranClientId(),
    useProduction: config.useProduction,
    redirectUri: getQuranRedirectUri(),
    authorizationEndpoint: quranDiscovery.authorizationEndpoint,
    scopes: getQuranScopes(),
  });
}

export async function createQuranNonce() {
  return Crypto.randomUUID();
}

function buildTokenExpiry(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return Date.now() + expiresIn * 1000;
}

async function readFunctionError(error: unknown) {
  const fallback =
    error instanceof Error
      ? error.message
      : "Supabase auth exchange failed. Deploy the quran-auth-exchange function and set the Quran OAuth secrets in Supabase.";

  const context = (error as { context?: Response | null })?.context;

  if (!context) {
    return fallback;
  }

  try {
    const payload = (await context.clone().json()) as {
      error?: unknown;
      error_description?: unknown;
      message?: unknown;
    };

    const detail =
      payload.error_description ?? payload.error ?? payload.message ?? null;

    if (typeof detail === "string" && detail.length > 0) {
      return detail;
    }
  } catch {
    try {
      const text = await context.clone().text();

      if (text.length > 0) {
        return text;
      }
    } catch {
      // keep fallback
    }
  }

  return fallback;
}

export async function exchangeQuranCode(params: {
  code: string;
  codeVerifier: string;
}) {
  if (!supabase) {
    throw new Error(
      "Supabase public config is missing in this build. Quran auth exchange is no longer routed through localhost.",
    );
  }

  if (__DEV__) {
    console.log("[Quran OAuth] exchange transport", "supabase-function");
  }

  const { data, error } = await supabase.functions.invoke(
    "quran-auth-exchange",
    {
      body: {
        code: params.code,
        codeVerifier: params.codeVerifier,
        redirectUri: getQuranRedirectUri(),
        useProduction: config.useProduction,
      },
    },
  );

  if (error) {
    throw new Error(await readFunctionError(error));
  }

  const exchangePayload = (data ?? {}) as {
    accessToken?: string | null;
    refreshToken?: string | null;
    idToken?: string | null;
    expiresIn?: number | null;
    user?: Record<string, string | null | undefined>;
    error?: string;
  };

  if (exchangePayload.error) {
    throw new Error(exchangePayload.error);
  }

  const userInfo = exchangePayload.user ?? {};

  const displayName =
    [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ").trim() ||
    userInfo.name ||
    userInfo.preferred_username ||
    null;

  const session: UserSession = {
    accessToken: exchangePayload.accessToken ?? null,
    refreshToken: exchangePayload.refreshToken ?? null,
    idToken: exchangePayload.idToken ?? null,
    tokenExpiresAt: buildTokenExpiry(exchangePayload.expiresIn ?? undefined),
    userId: userInfo.sub ?? null,
    displayName,
    email: userInfo.email ?? null,
    isGuest: false,
  };

  return session;
}

export async function refreshQuranSession(session: UserSession) {
  return session;
}

export function shouldRefreshQuranSession(session: UserSession) {
  if (!session.accessToken || !session.tokenExpiresAt) {
    return false;
  }

  return Date.now() >= session.tokenExpiresAt - 60_000;
}
