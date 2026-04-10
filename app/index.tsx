import { Redirect } from "expo-router";

import { config } from "../lib/config";

export default function IndexScreen() {
  if (config.skipQuranAuth) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
