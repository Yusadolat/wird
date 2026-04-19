import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import { captureException } from "../lib/sentry";

export function UpdatePrompt() {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || hasCheckedRef.current) {
      return;
    }

    let isMounted = true;
    hasCheckedRef.current = true;

    async function applyUpdate() {
      try {
        const result = await Updates.fetchUpdateAsync();

        if (result.isNew || result.isRollBackToEmbedded) {
          await Updates.reloadAsync();
        }
      } catch (error) {
        captureException(error, {
          tags: { area: "updates", action: "fetch_update" },
        });
      }
    }

    async function checkForUpdate() {
      try {
        const result = await Updates.checkForUpdateAsync();

        if (!isMounted || !result.isAvailable) {
          return;
        }

        Alert.alert(
          "Update available",
          "A newer version of Wird is ready. Apply it now?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Update now",
              onPress: () => {
                void applyUpdate();
              },
            },
          ],
        );
      } catch (error) {
        captureException(error, {
          tags: { area: "updates", action: "check_for_update" },
        });
      }
    }

    void checkForUpdate();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
