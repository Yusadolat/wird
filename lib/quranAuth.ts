type QuranAuthConfigInput = {
  oauthRedirectScheme: string;
  useProduction: boolean;
  preliveClientId?: string;
  productionClientId?: string;
  preliveBaseUrl?: string;
  productionBaseUrl?: string;
};

type QuranDiscoveryDocument = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  endSessionEndpoint: string;
  revocationEndpoint: string;
};

type QuranAuthDebugInfoInput = {
  clientId: string;
  useProduction: boolean;
  redirectUri: string;
  authorizationEndpoint: string;
  scopes: string[];
};

const PRELIVE_CLIENT_ID = "76f94997-5a90-45ac-9bbf-8eefaa2ef0e6";
const PRODUCTION_CLIENT_ID = "06b203f4-6481-4a6d-beb4-c218edca1a5f";
const PRELIVE_BASE_URL = "https://prelive-oauth2.quran.foundation";
const PRODUCTION_BASE_URL = "https://oauth2.quran.foundation";

export function getQuranAuthScopes(extraScopes: string[] = []) {
  return [
    ...new Set([
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
      ...extraScopes,
    ]),
  ];
}

export function buildQuranRedirectUri(scheme: string) {
  return `${scheme}://auth/callback`;
}

export function getQuranAuthConfig(input: QuranAuthConfigInput) {
  const baseUrl = input.useProduction
    ? input.productionBaseUrl ?? PRODUCTION_BASE_URL
    : input.preliveBaseUrl ?? PRELIVE_BASE_URL;
  const clientId = input.useProduction
    ? input.productionClientId ?? PRODUCTION_CLIENT_ID
    : input.preliveClientId ?? PRELIVE_CLIENT_ID;

  const discovery: QuranDiscoveryDocument = {
    authorizationEndpoint: `${baseUrl}/oauth2/auth`,
    tokenEndpoint: `${baseUrl}/oauth2/token`,
    userInfoEndpoint: `${baseUrl}/userinfo`,
    endSessionEndpoint: `${baseUrl}/oauth2/sessions/logout`,
    revocationEndpoint: `${baseUrl}/oauth2/revoke`,
  };

  return {
    clientId,
    baseUrl,
    redirectUri: buildQuranRedirectUri(input.oauthRedirectScheme),
    discovery,
  };
}

export function buildQuranAuthDebugInfo(input: QuranAuthDebugInfoInput) {
  return {
    environment: input.useProduction ? "production" : "prelive",
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    authorizationEndpoint: input.authorizationEndpoint,
    scopes: input.scopes.join(" "),
  } as const;
}
