export type GoalType =
  | "finish_30"
  | "finish_90"
  | "finish_365"
  | "memorize"
  | "custom";

export type ReadingLevel = "beginner" | "intermediate" | "advanced";

export interface WirdPlan {
  id: string;
  userId: string;
  goalType: GoalType;
  targetDays: number;
  startDate: string;
  dailyVerseTarget: number;
  completedVerses: string[];
  lastSessionDate: string | null;
  missedDays: number;
  recalibratedOn: string[];
  preferredReciter: number;
  notificationTime: string;
  readingLevel: ReadingLevel;
}

export interface DailyWird {
  date: string;
  startVerseKey: string;
  endVerseKey: string;
  verseCount: number;
  estimatedMinutes: number;
  chapterName: string;
  isCompleted: boolean;
  completedAt: string | null;
  reflectionQuestion: string | null;
  encouragementMessage?: string | null;
  aiRationale?: string | null;
  wasRecalibrated?: boolean;
}

export interface UserSession {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  tokenExpiresAt: number | null;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
}
