export const config = {
  contentApiBaseUrl:
    process.env.EXPO_PUBLIC_QF_CONTENT_API ??
    "https://api.qurancdn.com/api/qdc",
  qfPreliveClientId:
    process.env.EXPO_PUBLIC_QF_PRELIVE_CLIENT_ID ??
    "76f94997-5a90-45ac-9bbf-8eefaa2ef0e6",
  qfProductionClientId:
    process.env.EXPO_PUBLIC_QF_PROD_CLIENT_ID ??
    "06b203f4-6481-4a6d-beb4-c218edca1a5f",
  qfPreliveOauthBaseUrl:
    process.env.EXPO_PUBLIC_QF_PRELIVE_OAUTH_BASE_URL ??
    "https://prelive-oauth2.quran.foundation",
  qfProductionOauthBaseUrl:
    process.env.EXPO_PUBLIC_QF_PROD_OAUTH_BASE_URL ??
    "https://oauth2.quran.foundation",
  oauthRedirectScheme:
    process.env.EXPO_PUBLIC_OAUTH_REDIRECT_SCHEME ?? "wird",
  oauthRedirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI ?? null,
  skipQuranAuth:
    (process.env.EXPO_PUBLIC_SKIP_QF_AUTH ?? "false") === "true",
  defaultTranslationId: Number(
    process.env.EXPO_PUBLIC_DEFAULT_TRANSLATION_ID ?? "131",
  ),
  defaultTafsirId: Number(process.env.EXPO_PUBLIC_DEFAULT_TAFSIR_ID ?? "169"),
  defaultReciterId: Number(process.env.EXPO_PUBLIC_DEFAULT_RECITER_ID ?? "7"),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
  enableSupabaseSync:
    (process.env.EXPO_PUBLIC_ENABLE_SUPABASE_SYNC ?? "false") === "true",
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? null,
  sentryCaptureHandled:
    (process.env.EXPO_PUBLIC_SENTRY_CAPTURE_HANDLED ?? "true") === "true",
  sentrySmokeTest:
    (process.env.EXPO_PUBLIC_SENTRY_SMOKE_TEST ?? "false") === "true",
  useProduction:
    (process.env.EXPO_PUBLIC_QF_USE_PRODUCTION ?? "false") === "true",
} as const;
