import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { config } from "../lib/config";
import { getPersistenceStorage } from "../lib/persistenceStorage";
import {
  backfillRemoteSettings,
  fetchRemoteSettings,
  syncSettings,
} from "../services/syncService";
import { scheduleDailyWirdReminder } from "../services/notifications";
import type { ReadingLevel } from "../types/wird";

type SettingsStore = {
  notificationTime: string;
  preferredReciter: number;
  readingLevel: ReadingLevel;
  hasLoadedRemote: boolean;
  setNotificationTime: (value: string) => void;
  setPreferredReciter: (value: number) => void;
  setReadingLevel: (value: ReadingLevel) => void;
  hydrateRemote: () => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      notificationTime: "18:30",
      preferredReciter: config.defaultReciterId,
      readingLevel: "intermediate",
      hasLoadedRemote: false,
      setNotificationTime: (notificationTime) => {
        set({ notificationTime });
        const state = useSettingsStore.getState();
        void syncSettings({
          preferredReciter: state.preferredReciter,
          readingLevel: state.readingLevel,
          notificationTime,
        });
        void scheduleDailyWirdReminder(notificationTime);
      },
      setPreferredReciter: (preferredReciter) => {
        set({ preferredReciter });
        const state = useSettingsStore.getState();
        void syncSettings({
          preferredReciter,
          readingLevel: state.readingLevel,
          notificationTime: state.notificationTime,
        });
      },
      setReadingLevel: (readingLevel) => {
        set({ readingLevel });
        const state = useSettingsStore.getState();
        void syncSettings({
          preferredReciter: state.preferredReciter,
          readingLevel,
          notificationTime: state.notificationTime,
        });
      },
      hydrateRemote: async () => {
        const localSettings = {
          preferredReciter: useSettingsStore.getState().preferredReciter,
          readingLevel: useSettingsStore.getState().readingLevel,
          notificationTime: useSettingsStore.getState().notificationTime,
        };
        const remoteSettings = await fetchRemoteSettings();

        if (!remoteSettings) {
          void backfillRemoteSettings(localSettings);
          set({ hasLoadedRemote: true });
          return;
        }

        set({
          preferredReciter: remoteSettings.preferredReciter,
          readingLevel: remoteSettings.readingLevel,
          notificationTime: remoteSettings.notificationTime,
          hasLoadedRemote: true,
        });

        void scheduleDailyWirdReminder(remoteSettings.notificationTime);
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(getPersistenceStorage),
    },
  ),
);
