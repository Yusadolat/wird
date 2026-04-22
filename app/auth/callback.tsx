import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { config } from "../../lib/config";
import { captureException } from "../../lib/sentry";
import {
  clearPendingAuth,
  loadPendingAuth,
} from "../../services/authStorage";
import { exchangeQuranCode } from "../../services/quranAuthService";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";

export default function QuranAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    state?: string | string[];
  }>();
  const finishSignIn = useAuthStore((state) => state.finishSignIn);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const userId = useAuthStore((state) => state.userId);
  const hasCompletedOnboarding = useOnboardingStore(
    (state) => state.hasCompletedOnboarding,
  );

  useEffect(() => {
    void (async () => {
      setAuthenticating(true);
      setAuthError(null);

      try {
        const code = Array.isArray(params.code) ? params.code[0] : params.code;
        const returnedState = Array.isArray(params.state)
          ? params.state[0]
          : params.state;

        if (!code) {
          throw new Error("Quran.com did not return an authorization code.");
        }

        const pendingAuth = await loadPendingAuth();

        if (!pendingAuth?.codeVerifier) {
          if (userId) {
            router.replace(hasCompletedOnboarding ? "/(tabs)" : "/(onboarding)/goal");
            return;
          }

          throw new Error(
            "Missing PKCE verifier for Quran.com sign-in. Please try again.",
          );
        }

        if (returnedState !== pendingAuth.state) {
          throw new Error("Quran.com sign-in returned an unexpected state.");
        }

        const session = await exchangeQuranCode({
          code,
          codeVerifier: pendingAuth.codeVerifier,
        });

        await clearPendingAuth();
        await finishSignIn(session);
        router.replace(hasCompletedOnboarding ? "/(tabs)" : "/(onboarding)/goal");
      } catch (error) {
        await clearPendingAuth();

        if (config.sentryCaptureHandled) {
          captureException(error, {
            tags: { area: "auth", action: "oauth_callback_exchange" },
          });
        }

        setAuthenticating(false);
        setAuthError(
          error instanceof Error
            ? error.message
            : "Unable to complete Quran.com sign-in.",
        );
        router.replace("/(auth)/login");
      }
    })();
  }, [
    finishSignIn,
    hasCompletedOnboarding,
    params.code,
    params.state,
    router,
    setAuthError,
    setAuthenticating,
    userId,
  ]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.accentPrimary} />
      <Text style={styles.text}>Finishing Quran.com sign-in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
