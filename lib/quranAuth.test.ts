import { describe, expect, it } from "vitest";

import {
  buildQuranAuthDebugInfo,
  buildQuranRedirectUri,
  getQuranAuthConfig,
  getQuranAuthScopes,
} from "./quranAuth";

describe("quranAuth", () => {
  it("builds prelive configuration by default", () => {
    const config = getQuranAuthConfig({
      oauthRedirectScheme: "wird",
      useProduction: false,
    });

    expect(config.clientId).toBe("76f94997-5a90-45ac-9bbf-8eefaa2ef0e6");
    expect(config.discovery.authorizationEndpoint).toBe(
      "https://prelive-oauth2.quran.foundation/oauth2/auth",
    );
    expect(config.discovery.tokenEndpoint).toBe(
      "https://prelive-oauth2.quran.foundation/oauth2/token",
    );
  });

  it("switches to production endpoints when requested", () => {
    const config = getQuranAuthConfig({
      oauthRedirectScheme: "wird",
      useProduction: true,
    });

    expect(config.clientId).toBe("06b203f4-6481-4a6d-beb4-c218edca1a5f");
    expect(config.discovery.authorizationEndpoint).toBe(
      "https://oauth2.quran.foundation/oauth2/auth",
    );
    expect(config.discovery.userInfoEndpoint).toBe(
      "https://oauth2.quran.foundation/userinfo",
    );
  });

  it("uses quran foundation scopes needed for sign-in and future sync", () => {
    expect(getQuranAuthScopes()).toEqual([
      "openid",
      "offline_access",
      "profile",
      "bookmark",
      "reading_session",
      "activity_day",
      "goal",
      "streak",
      "preference",
      "user",
    ]);
  });

  it("builds the native redirect uri for the app scheme", () => {
    expect(buildQuranRedirectUri("wird")).toBe("wird://auth/callback");
  });

  it("builds debug info with environment and redirect details", () => {
    const debug = buildQuranAuthDebugInfo({
      clientId: "client-123",
      useProduction: false,
      redirectUri: "wird://auth/callback",
      authorizationEndpoint:
        "https://prelive-oauth2.quran.foundation/oauth2/auth",
      scopes: ["openid", "profile"],
    });

    expect(debug.environment).toBe("prelive");
    expect(debug.redirectUri).toBe("wird://auth/callback");
    expect(debug.clientId).toBe("client-123");
  });
});
