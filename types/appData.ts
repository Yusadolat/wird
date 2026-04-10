export type BookmarkRecord = {
  id: string;
  verseKey: string;
  chapterName: string;
  title: string;
  createdAt: string;
};

export type ReadingSessionRecord = {
  id: string;
  chapterNumber: number;
  chapterName: string;
  startVerse: number;
  endVerse: number;
  verseCount: number;
  completedAt: string;
  estimatedMinutes: number;
};

export type ReflectionNoteRecord = {
  id: string;
  chapterNumber: number;
  chapterName: string;
  startVerse: number;
  endVerse: number;
  verseRange: string;
  prompt: string;
  note: string;
  tafsirSource: string;
  createdAt: string;
};

export type SettingsSyncPayload = {
  preferredReciter: number;
  readingLevel: "beginner" | "intermediate" | "advanced";
  notificationTime: string;
};

export type RemoteAppData = {
  bookmarks: BookmarkRecord[];
  readingSessions: ReadingSessionRecord[];
  reflectionNotes: ReflectionNoteRecord[];
};
