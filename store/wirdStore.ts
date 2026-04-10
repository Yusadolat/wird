import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { config } from "../lib/config";
import { getPersistenceStorage } from "../lib/persistenceStorage";
import type { DailyWird, GoalType, WirdPlan } from "../types/wird";

const TOTAL_QURAN_VERSES = 6236;

const GOAL_DEFAULTS: Record<GoalType, number> = {
  finish_30: 30,
  finish_90: 90,
  finish_365: 365,
  memorize: 180,
  custom: 180,
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildPlan(goalType: GoalType, targetDays: number): WirdPlan {
  return {
    id: "local-plan",
    userId: "guest",
    goalType,
    targetDays,
    startDate: todayDate(),
    dailyVerseTarget: Math.ceil(TOTAL_QURAN_VERSES / targetDays),
    completedVerses: [],
    lastSessionDate: null,
    missedDays: 0,
    recalibratedOn: [],
    preferredReciter: config.defaultReciterId,
    notificationTime: "18:30",
    readingLevel: "intermediate",
  };
}

type WirdStore = {
  plan: WirdPlan | null;
  today: DailyWird | null;
  ensurePlan: () => void;
  configureGoal: (goalType: GoalType, targetDays?: number) => void;
  setPlan: (plan: WirdPlan) => void;
  setToday: (today: DailyWird) => void;
  completeToday: () => void;
};

export const useWirdStore = create<WirdStore>()(
  persist(
    (set) => ({
      plan: null,
      today: null,
      ensurePlan: () =>
        set((state) => {
          if (state.plan) {
            return state;
          }

          return {
            plan: buildPlan("finish_90", GOAL_DEFAULTS.finish_90),
          };
        }),
      configureGoal: (goalType, targetDays) =>
        set((state) => ({
          plan: state.plan
            ? {
                ...state.plan,
                goalType,
                targetDays: targetDays ?? GOAL_DEFAULTS[goalType],
                dailyVerseTarget: Math.ceil(
                  TOTAL_QURAN_VERSES / (targetDays ?? GOAL_DEFAULTS[goalType]),
                ),
              }
            : buildPlan(goalType, targetDays ?? GOAL_DEFAULTS[goalType]),
        })),
      setPlan: (plan) => set({ plan }),
      setToday: (today) => set({ today }),
      completeToday: () =>
        set((state) => ({
          today: state.today
            ? {
                ...state.today,
                isCompleted: true,
                completedAt: new Date().toISOString(),
              }
            : state.today,
        })),
    }),
    {
      name: "wird-plan",
      storage: createJSONStorage(getPersistenceStorage),
    },
  ),
);
