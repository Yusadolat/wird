import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getPersistenceStorage } from "../lib/persistenceStorage";

type OnboardingStore = {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: "wird-onboarding",
      storage: createJSONStorage(getPersistenceStorage),
    },
  ),
);
