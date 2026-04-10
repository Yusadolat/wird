import type { ReadingSessionRecord } from "../types/appData";
import type { GoalType, WirdPlan } from "../types/wird";
import { supabase } from "../lib/supabase";
import type { QuranChapter } from "./quranApi";

const TOTAL_QURAN_VERSES = 6236;

export const GOAL_OPTIONS: {
  goalType: GoalType;
  targetDays: number;
  title: string;
  subtitle: string | null;
}[] = [
  {
    goalType: "finish_30",
    targetDays: 30,
    title: "Finish Quran in 30 days",
    subtitle: "(intensive)",
  },
  {
    goalType: "finish_90",
    targetDays: 90,
    title: "Finish Quran in 90 days",
    subtitle: "(balanced)",
  },
  {
    goalType: "finish_365",
    targetDays: 365,
    title: "Finish Quran in 1 year",
    subtitle: "(steady)",
  },
  {
    goalType: "memorize",
    targetDays: 180,
    title: "Memorize 1 page/week",
    subtitle: null,
  },
  {
    goalType: "custom",
    targetDays: 180,
    title: "Just 10 min/day",
    subtitle: "(custom)",
  },
];

export type PlannedDailyWird = {
  chapterNumber: number;
  chapterName: string;
  chapterArabic: string;
  startVerse: number;
  endVerse: number;
  startVerseKey: string;
  endVerseKey: string;
  verseCount: number;
  estimatedMinutes: number;
  progressPct: number;
  dayNumber: number;
  targetDays: number;
  isCompletedToday: boolean;
  completedAt: string | null;
  encouragementMessage: string;
  aiRationale: string;
  wasRecalibrated: boolean;
  missedDays: number;
  currentStreakDays: number;
  intensityLabel: string;
};

type PlannerSummary = {
  targetVerseCount: number;
  encouragementMessage: string;
  aiRationale: string;
  wasRecalibrated: boolean;
};

function toIsoDate(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function diffInDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000),
  );
}

function verseToOffset(
  chapters: QuranChapter[],
  chapterNumber: number,
  verseNumber: number,
) {
  const previousVerses = chapters
    .slice(0, chapterNumber - 1)
    .reduce((sum, chapter) => sum + chapter.versesCount, 0);

  return previousVerses + (verseNumber - 1);
}

function offsetToVerse(chapters: QuranChapter[], offset: number) {
  let remaining = offset;

  for (const chapter of chapters) {
    if (remaining < chapter.versesCount) {
      return {
        chapterNumber: chapter.id,
        chapterName: chapter.nameSimple,
        chapterArabic: chapter.nameArabic,
        verseNumber: remaining + 1,
        chapterVerses: chapter.versesCount,
      };
    }

    remaining -= chapter.versesCount;
  }

  const lastChapter = chapters[chapters.length - 1];

  return {
    chapterNumber: lastChapter.id,
    chapterName: lastChapter.nameSimple,
    chapterArabic: lastChapter.nameArabic,
    verseNumber: lastChapter.versesCount,
    chapterVerses: lastChapter.versesCount,
  };
}

function getCompletedOffset(
  chapters: QuranChapter[],
  readingSessions: ReadingSessionRecord[],
) {
  if (readingSessions.length === 0) {
    return 0;
  }

  return readingSessions.reduce((highestOffset, session) => {
    const sessionOffset =
      verseToOffset(chapters, session.chapterNumber, session.endVerse) + 1;

    return Math.max(highestOffset, sessionOffset);
  }, 0);
}

function getUniqueSessionDays(readingSessions: ReadingSessionRecord[]) {
  return new Set(
    readingSessions.map((session) => session.completedAt.slice(0, 10)),
  ).size;
}

function getCurrentStreakDays(
  readingSessions: ReadingSessionRecord[],
  currentDate: string,
) {
  const uniqueDays = new Set(
    readingSessions.map((session) => session.completedAt.slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date(`${currentDate}T00:00:00.000Z`);

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function clampVerseTarget(value: number, remainingVerses: number) {
  return Math.max(1, Math.min(Math.round(value || 1), Math.max(remainingVerses, 1)));
}

function buildFallbackSummary(args: {
  targetVerseCount: number;
  missedDays: number;
  remainingDays: number;
}) {
  const { targetVerseCount, missedDays, remainingDays } = args;

  if (missedDays <= 0) {
    return {
      targetVerseCount,
      encouragementMessage: "Your wird is ready for today.",
      aiRationale:
        "Baseline adaptive plan generated from your goal timeline and current progress.",
      wasRecalibrated: false,
    } satisfies PlannerSummary;
  }

  if (missedDays <= 7) {
    return {
      targetVerseCount,
      encouragementMessage: "Your plan has been updated — you're still on track.",
      aiRationale:
        "Recent missed days were absorbed by redistributing the remaining verses gently across the days ahead.",
      wasRecalibrated: true,
    } satisfies PlannerSummary;
  }

  if (missedDays <= 30) {
    return {
      targetVerseCount: Math.max(1, Math.min(targetVerseCount, Math.ceil(targetVerseCount * 0.85))),
      encouragementMessage: "Welcome back. Your wird is ready.",
      aiRationale:
        "The plan has been softened after a longer pause so you can re-enter the routine without pressure.",
      wasRecalibrated: true,
    } satisfies PlannerSummary;
  }

  return {
    targetVerseCount: Math.max(1, Math.min(targetVerseCount, 6)),
    encouragementMessage: "Welcome back. Begin gently and rebuild your rhythm.",
    aiRationale:
      "After a long gap, today's reading is intentionally lighter to support a fresh and sustainable restart.",
    wasRecalibrated: true,
  } satisfies PlannerSummary;
}

function getIntensityLabel(args: {
  targetVerseCount: number;
  baselineTargetVerseCount: number;
  missedDays: number;
}) {
  if (args.missedDays >= 14 || args.targetVerseCount <= 6) {
    return "Gentle restart";
  }

  if (args.missedDays > 0 || args.targetVerseCount < args.baselineTargetVerseCount) {
    return "Adaptive reset";
  }

  if (args.targetVerseCount >= Math.max(args.baselineTargetVerseCount + 3, 18)) {
    return "Focused push";
  }

  return "Steady pace";
}

async function getAiPlannerSummary(args: {
  plan: WirdPlan | null;
  readingSessions: ReadingSessionRecord[];
  targetVerseCount: number;
  remainingVerses: number;
  remainingDays: number;
  dayNumber: number;
  completedOffset: number;
  missedDays: number;
  lastSessionDate: string | null;
}) {
  if (!supabase) {
    return null;
  }

  const recentSessions = args.readingSessions
    .slice(0, 7)
    .map((session) => ({
      verseCount: session.verseCount,
      completedAt: session.completedAt,
      chapterName: session.chapterName,
      startVerse: session.startVerse,
      endVerse: session.endVerse,
    }));

  const { data, error } = await supabase.functions.invoke("wird-planner", {
    body: {
      goalType: args.plan?.goalType ?? "finish_90",
      targetDays: args.plan?.targetDays ?? 90,
      startDate: args.plan?.startDate ?? new Date().toISOString().slice(0, 10),
      dayNumber: args.dayNumber,
      remainingVerses: args.remainingVerses,
      remainingDays: args.remainingDays,
      completedVerses: args.completedOffset,
      missedDays: args.missedDays,
      dailyVerseTarget: args.targetVerseCount,
      lastSessionDate: args.lastSessionDate,
      recentSessions,
    },
  });

  if (error) {
    if (__DEV__) {
      console.log("[AI Wird Planner] invoke failed", error.message);
    }
    return null;
  }

  const payload = (data ?? {}) as Partial<PlannerSummary>;

  if (!payload.targetVerseCount || !payload.encouragementMessage || !payload.aiRationale) {
    if (__DEV__) {
      console.log("[AI Wird Planner] incomplete payload", payload);
    }
    return null;
  }

  return {
    targetVerseCount: clampVerseTarget(payload.targetVerseCount, args.remainingVerses),
    encouragementMessage: String(payload.encouragementMessage),
    aiRationale: String(payload.aiRationale),
    wasRecalibrated: Boolean(payload.wasRecalibrated),
  } satisfies PlannerSummary;
}

export async function planDailyWird(args: {
  chapters: QuranChapter[];
  plan: WirdPlan | null;
  readingSessions: ReadingSessionRecord[];
  now?: Date;
}) {
  const { chapters, plan, readingSessions, now = new Date() } = args;

  if (chapters.length === 0) {
    throw new Error("Cannot plan a wird without chapter metadata.");
  }

  const currentDate = toIsoDate(now);
  const targetDays = plan?.targetDays ?? 90;
  const startDate = plan?.startDate ?? currentDate;
  const dayNumber = diffInDays(startDate, currentDate) + 1;
  const completedOffset = Math.min(
    getCompletedOffset(chapters, readingSessions),
    TOTAL_QURAN_VERSES,
  );
  const uniqueSessionDays = getUniqueSessionDays(readingSessions);
  const missedDays = Math.max(dayNumber - 1 - uniqueSessionDays, 0);
  const remainingVerses = Math.max(TOTAL_QURAN_VERSES - completedOffset, 0);
  const remainingDays = Math.max(targetDays - dayNumber + 1, 1);
  const baselineTargetVerseCount = Math.max(
    1,
    Math.min(Math.ceil(remainingVerses / remainingDays), remainingVerses || 1),
  );
  const lastSessionDate = readingSessions[0]?.completedAt ?? null;
  const currentStreakDays = getCurrentStreakDays(readingSessions, currentDate);
  const plannerSummary =
    (await getAiPlannerSummary({
      plan,
      readingSessions,
      targetVerseCount: baselineTargetVerseCount,
      remainingVerses,
      remainingDays,
      dayNumber,
      completedOffset,
      missedDays,
      lastSessionDate,
    })) ??
    buildFallbackSummary({
      targetVerseCount: baselineTargetVerseCount,
      missedDays,
      remainingDays,
    });

  const start = offsetToVerse(chapters, Math.min(completedOffset, TOTAL_QURAN_VERSES - 1));
  const cappedEndVerse = Math.min(
    start.verseNumber + plannerSummary.targetVerseCount - 1,
    start.chapterVerses,
  );
  const verseCount = Math.max(cappedEndVerse - start.verseNumber + 1, 1);
  const todaySession = readingSessions.find((session) =>
    session.completedAt.startsWith(currentDate),
  );

  return {
    chapterNumber: start.chapterNumber,
    chapterName: start.chapterName,
    chapterArabic: start.chapterArabic,
    startVerse: start.verseNumber,
    endVerse: cappedEndVerse,
    startVerseKey: `${start.chapterNumber}:${start.verseNumber}`,
    endVerseKey: `${start.chapterNumber}:${cappedEndVerse}`,
    verseCount,
    estimatedMinutes: Math.max(1, Math.ceil(verseCount * 0.8)),
    progressPct: Math.round((completedOffset / TOTAL_QURAN_VERSES) * 100),
    dayNumber,
    targetDays,
    isCompletedToday: Boolean(todaySession),
    completedAt: todaySession?.completedAt ?? null,
    encouragementMessage: plannerSummary.encouragementMessage,
    aiRationale: plannerSummary.aiRationale,
    wasRecalibrated: plannerSummary.wasRecalibrated,
    missedDays,
    currentStreakDays,
    intensityLabel: getIntensityLabel({
      targetVerseCount: plannerSummary.targetVerseCount,
      baselineTargetVerseCount,
      missedDays,
    }),
  } satisfies PlannedDailyWird;
}
