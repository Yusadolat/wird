import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { UpdatePrompt } from "../components/UpdatePrompt";
import { colors } from "../constants/theme";
import { config } from "../lib/config";
import { captureException, flush } from "../lib/sentry";
import { useAppDataStore } from "../store/appDataStore";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { useSettingsStore } from "../store/settingsStore";

const sentryEnvironment =
  (Constants.expoConfig?.extra?.eas as { channel?: string } | undefined)?.channel ??
  (__DEV__ ? "development" : "production");

if (config.sentryDsn) {
  (Sentry as unknown as { enableInExpoDevelopment?: boolean }).enableInExpoDevelopment =
    true;

  Sentry.init({
    dsn: config.sentryDsn,
    enableNative: true,
    debug: __DEV__,
    environment: sentryEnvironment,
    tracesSampleRate: 1,
  });
}

export default Sentry.wrap(function RootLayout() {
  const segments = useSegments();
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hydrateAppData = useAppDataStore((state) => state.hydrateRemote);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrateSettings = useSettingsStore((state) => state.hydrateRemote);
  const userId = useAuthStore((state) => state.userId);
  const hasCompletedOnboarding = useOnboardingStore(
    (state) => state.hasCompletedOnboarding,
  );

  const topLevelSegment = segments[0];
  const secondSegment = segments.at(1);
  const isAuthRoute = topLevelSegment === "(auth)";
  const isOAuthCallbackRoute =
    topLevelSegment === "auth" && secondSegment === "callback";
  const isOnboardingRoute = topLevelSegment === "(onboarding)";
  const isSignedIn = isGuest || Boolean(userId);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!__DEV__ || !config.sentrySmokeTest) {
      return;
    }

    captureException(new Error("Sentry smoke test (dev)"), {
      tags: { area: "sentry", action: "smoke_test" },
      extra: { environment: sentryEnvironment },
    });

    void flush();
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    void hydrateAppData();
    void hydrateSettings();
  }, [hydrateAppData, hydrateSettings]);

  if (!isHydrated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bgPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StatusBar style="light" />
            <ActivityIndicator size="small" color={colors.accentPrimary} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!isSignedIn && !isAuthRoute && !isOAuthCallbackRoute) {
    return <Redirect href="/(auth)/login" />;
  }

  if (
    isSignedIn &&
    !config.skipQuranAuth &&
    !hasCompletedOnboarding &&
    !isOnboardingRoute
  ) {
    return <Redirect href="/(onboarding)/goal" />;
  }

  if (isSignedIn && hasCompletedOnboarding && (isAuthRoute || isOnboardingRoute)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UpdatePrompt />
        <StatusBar style="light" />
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgPrimary },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="(onboarding)/goal" />
          <Stack.Screen name="(onboarding)/schedule" />
          <Stack.Screen name="(onboarding)/level" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reader" />
          <Stack.Screen name="reflection" />
          <Stack.Screen name="history" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
