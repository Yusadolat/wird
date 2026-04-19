import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { config } from "../../lib/config";
import { captureException } from "../../lib/sentry";
import {
  clearPendingAuth,
  loadPendingAuth,
  savePendingAuth,
} from "../../services/authStorage";
import {
  createQuranNonce,
  getQuranAuthDebugInfo,
  exchangeQuranCode,
  getQuranClientId,
  getQuranRedirectUri,
  getQuranScopes,
  quranDiscovery,
} from "../../services/quranAuthService";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const authError = useAuthStore((state) => state.authError);
  const finishSignIn = useAuthStore((state) => state.finishSignIn);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const handledCodeRef = useRef<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const debugInfo = getQuranAuthDebugInfo();

  useEffect(() => {
    void (async () => {
      if (!nonce) {
        setNonce(await createQuranNonce());
      }
    })();
  }, [nonce]);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getQuranClientId(),
      scopes: getQuranScopes(),
      redirectUri: getQuranRedirectUri(),
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: nonce ? { nonce } : undefined,
    },
    quranDiscovery,
  );

  useEffect(() => {
    if (__DEV__) {
      console.log("[Quran OAuth] request", {
        ...debugInfo,
        nonce,
        codeVerifierReady: Boolean(request?.codeVerifier),
        authUrl,
      });
    }
  }, [authUrl, debugInfo, nonce, request?.codeVerifier]);

  useEffect(() => {
    void (async () => {
      if (!request) {
        return;
      }

      try {
        const builtAuthUrl = request.url ?? (await request.makeAuthUrlAsync(quranDiscovery));
        setAuthUrl(builtAuthUrl);

        if (__DEV__) {
          console.log("[Quran OAuth] built auth url", builtAuthUrl);
        }
      } catch (error) {
      if (config.sentryCaptureHandled) {
        captureException(error, {
          tags: { area: "auth", action: "oauth_build_auth_url" },
        });
      }

        if (__DEV__) {
          console.log("[Quran OAuth] failed to build auth url", error);
        }
      }
    })();
  }, [request]);

  useEffect(() => {
    if (response?.type === "error") {
      if (__DEV__) {
        console.log("[Quran OAuth] response error", response);
      }
      setAuthenticating(false);
      setAuthError(
        (typeof response.error === "string" && response.error) ||
          response.params.error_description ||
          response.errorCode ||
          "Quran.com sign-in failed.",
      );
      return;
    }

    if (response?.type !== "success") {
      if (__DEV__ && response) {
        console.log("[Quran OAuth] response", response);
      }
      return;
    }
  }, [
    response,
    setAuthError,
    setAuthenticating,
  ]);

  async function handleAuthCode(code?: string) {
    if (!code || handledCodeRef.current === code) {
      return;
    }

    handledCodeRef.current = code;

    try {
      const pendingAuth = await loadPendingAuth();
      const codeVerifier = pendingAuth?.codeVerifier ?? request?.codeVerifier;

      if (!codeVerifier) {
        throw new Error(
          "Missing PKCE verifier for Quran.com sign-in. Please try again.",
        );
      }

      const session = await exchangeQuranCode({
        code,
        codeVerifier,
      });
      await clearPendingAuth();
      if (__DEV__) {
        console.log("[Quran OAuth] exchange success", {
          userId: session.userId,
          email: session.email,
        });
      }
      await finishSignIn(session);
      router.replace("/(onboarding)/goal");
    } catch (error) {
      await clearPendingAuth();

      if (config.sentryCaptureHandled) {
        captureException(error, {
          tags: { area: "auth", action: "oauth_exchange_code" },
        });
      }

      if (__DEV__) {
        console.log("[Quran OAuth] exchange failure", error);
      }
      setAuthenticating(false);
      setAuthError(
        error instanceof Error
          ? error.message
          : "Unable to complete Quran.com sign-in.",
      );
    }
  }

  async function handleSignIn() {
    if (config.skipQuranAuth) {
      handleGuestContinue();
      router.replace("/(onboarding)/goal");
      return;
    }

    if (!request) {
      setAuthenticating(false);
      setAuthError("Quran.com sign-in is still preparing. Try again.");
      return;
    }

    if (request.codeVerifier) {
      await savePendingAuth({ codeVerifier: request.codeVerifier });
    }

    handledCodeRef.current = null;
    resetOnboarding();
    setAuthError(null);
    setAuthenticating(true);

    const result = await promptAsync();

    if (__DEV__) {
      console.log("[Quran OAuth] prompt result", result);
    }

    if (result.type === "success") {
      await handleAuthCode(result.params.code);
      return;
    }

    if (result.type === "dismiss" || result.type === "cancel") {
      await clearPendingAuth();
      setAuthenticating(false);
    }
  }

  function handleGuestContinue() {
    resetOnboarding();
    setAuthError(null);
    continueAsGuest();
    router.replace("/(onboarding)/goal");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.crescentWrap}>
          <Text style={styles.crescent}>☽</Text>
        </View>
        <View style={{ height: 32 }} />
        <Text style={styles.appName}>Wird</Text>
        <Text style={styles.arabicName}>وِرْد</Text>
        <View style={{ height: 12 }} />
        <Text style={styles.tagline}>Your daily Quran companion</Text>
        <View style={{ height: 16 }} />
        <Text style={styles.desc}>
          An AI companion that builds your personalized daily Quran routine —
          and silently recalibrates when life gets in the way.
        </Text>
        <View style={{ flex: 1 }} />
        <View style={styles.ctaContainer}>
          <Pressable
            style={[
              styles.signInButton,
              (!request || isAuthenticating) &&
                !config.skipQuranAuth &&
                styles.signInButtonDisabled,
            ]}
            disabled={
              (!request && !config.skipQuranAuth) || isAuthenticating
            }
            onPress={() => void handleSignIn()}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.signInLabel}>
                {config.skipQuranAuth
                  ? "Continue to Demo"
                  : "Sign in with Quran.com"}
              </Text>
            )}
          </Pressable>
          {config.skipQuranAuth ? (
            <Text style={styles.prototypeText}>
              Demo mode keeps the app accessible while Quran.com sync is being
              finalized.
            </Text>
          ) : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          <Pressable onPress={handleGuestContinue}>
            <Text style={styles.guestLink}>Continue in guest mode</Text>
          </Pressable>
        </View>
        {__DEV__ && !config.skipQuranAuth ? (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>OAuth Debug</Text>
            <Text style={styles.debugLine}>
              env: {debugInfo.environment}
            </Text>
            <Text style={styles.debugLine}>
              client: {debugInfo.clientId}
            </Text>
            <Text style={styles.debugLine}>
              redirect: {debugInfo.redirectUri}
            </Text>
            <Text style={styles.debugLine}>
              auth: {debugInfo.authorizationEndpoint}
            </Text>
            <Text style={styles.debugLine}>
              scopes: {debugInfo.scopes}
            </Text>
            <Text style={styles.debugLine}>
              nonce: {nonce ?? "pending"}
            </Text>
            <Text style={styles.debugLine}>
              verifier: {request?.codeVerifier ? "ready" : "pending"}
            </Text>
            <Text style={styles.debugLine}>
              actual redirect: {authUrl ? getQueryParam(authUrl, "redirect_uri") : "pending"}
            </Text>
            <Text style={styles.debugLine}>
              full auth url: {authUrl ?? "pending"}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function getQueryParam(url: string, key: string) {
  try {
    return new URL(url).searchParams.get(key) ?? "missing";
  } catch {
    return "unreadable";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  crescentWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  crescent: {
    fontSize: 72,
    color: colors.accentPrimary,
    opacity: 0.3,
  },
  appName: {
    fontSize: 56,
    fontWeight: "300",
    color: colors.textPrimary,
    letterSpacing: 4,
    textAlign: "center",
  },
  arabicName: {
    fontSize: 32,
    fontWeight: "300",
    color: colors.accentPrimary,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22.4,
    width: "100%",
  },
  ctaContainer: {
    width: "100%",
    gap: 16,
  },
  signInButton: {
    height: 56,
    backgroundColor: colors.accentPrimary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textInverse,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
    textAlign: "center",
  },
  prototypeText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "center",
  },
  guestLink: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugCard: {
    width: "100%",
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  debugTitle: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  debugLine: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
