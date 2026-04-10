import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getPersistenceStorage } from "../lib/persistenceStorage";
import type {
  BookmarkRecord,
  ReadingSessionRecord,
  ReflectionNoteRecord,
} from "../types/appData";
import {
  backfillRemoteAppData,
  fetchRemoteAppData,
  removeBookmarkEverywhere,
  syncBookmark,
  syncReadingSession,
  syncReflectionNote,
} from "../services/syncService";

type AddBookmarkInput = Omit<BookmarkRecord, "id" | "createdAt">;
type AddReadingSessionInput = Omit<ReadingSessionRecord, "id" | "completedAt"> & {
  completedAt?: string;
};
type AddReflectionInput = Omit<ReflectionNoteRecord, "id" | "createdAt"> & {
  createdAt?: string;
};

type AppDataStore = {
  bookmarks: BookmarkRecord[];
  readingSessions: ReadingSessionRecord[];
  reflectionNotes: ReflectionNoteRecord[];
  hasLoadedRemote: boolean;
  addBookmark: (input: AddBookmarkInput) => void;
  removeBookmark: (verseKey: string) => void;
  toggleBookmark: (input: AddBookmarkInput) => boolean;
  addReadingSession: (input: AddReadingSessionInput) => void;
  addReflectionNote: (input: AddReflectionInput) => void;
  isBookmarked: (verseKey: string) => boolean;
  hydrateRemote: () => Promise<void>;
};

function sortNewestFirst<T extends { createdAt?: string; completedAt?: string }>(
  items: T[],
) {
  return [...items].sort((left, right) => {
    const leftValue = left.createdAt ?? left.completedAt ?? "";
    const rightValue = right.createdAt ?? right.completedAt ?? "";

    return rightValue.localeCompare(leftValue);
  });
}

function mergeUniqueById<T extends { id: string }>(localItems: T[], remoteItems: T[]) {
  const merged = new Map<string, T>();

  for (const item of remoteItems) {
    merged.set(item.id, item);
  }

  for (const item of localItems) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()];
}

export const useAppDataStore = create<AppDataStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      readingSessions: [],
      reflectionNotes: [],
      hasLoadedRemote: false,
      addBookmark: (input) => {
        const bookmark: BookmarkRecord = {
          id: Crypto.randomUUID(),
          verseKey: input.verseKey,
          chapterName: input.chapterName,
          title: input.title,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bookmarks: sortNewestFirst([bookmark, ...state.bookmarks]),
        }));

        void syncBookmark(bookmark);
      },
      removeBookmark: (verseKey) => {
        const bookmark = get().bookmarks.find((item) => item.verseKey === verseKey);

        set((state) => ({
          bookmarks: state.bookmarks.filter((item) => item.verseKey !== verseKey),
        }));

        if (bookmark) {
          void removeBookmarkEverywhere({
            id: bookmark.id,
            verseKey: bookmark.verseKey,
          });
        }
      },
      toggleBookmark: (input) => {
        if (get().isBookmarked(input.verseKey)) {
          get().removeBookmark(input.verseKey);
          return false;
        }

        get().addBookmark(input);
        return true;
      },
      addReadingSession: (input) => {
        const session: ReadingSessionRecord = {
          id: Crypto.randomUUID(),
          ...input,
          completedAt: input.completedAt ?? new Date().toISOString(),
        };

        set((state) => ({
          readingSessions: sortNewestFirst([session, ...state.readingSessions]),
        }));

        void syncReadingSession(session);
      },
      addReflectionNote: (input) => {
        const note: ReflectionNoteRecord = {
          id: Crypto.randomUUID(),
          ...input,
          createdAt: input.createdAt ?? new Date().toISOString(),
        };

        set((state) => ({
          reflectionNotes: sortNewestFirst([note, ...state.reflectionNotes]),
        }));

        void syncReflectionNote(note);
      },
      isBookmarked: (verseKey) =>
        get().bookmarks.some((item) => item.verseKey === verseKey),
      hydrateRemote: async () => {
        const localData = {
          bookmarks: get().bookmarks,
          readingSessions: get().readingSessions,
          reflectionNotes: get().reflectionNotes,
        };
        const remoteData = await fetchRemoteAppData();

        if (!remoteData) {
          set({ hasLoadedRemote: true });
          return;
        }

        const mergedData = {
          bookmarks: sortNewestFirst(
            mergeUniqueById(localData.bookmarks, remoteData.bookmarks),
          ),
          readingSessions: sortNewestFirst(
            mergeUniqueById(localData.readingSessions, remoteData.readingSessions),
          ),
          reflectionNotes: sortNewestFirst(
            mergeUniqueById(localData.reflectionNotes, remoteData.reflectionNotes),
          ),
        };

        if (
          localData.bookmarks.length > remoteData.bookmarks.length ||
          localData.readingSessions.length > remoteData.readingSessions.length ||
          localData.reflectionNotes.length > remoteData.reflectionNotes.length
        ) {
          void backfillRemoteAppData(mergedData);
        }

        set({
          bookmarks: mergedData.bookmarks,
          readingSessions: mergedData.readingSessions,
          reflectionNotes: mergedData.reflectionNotes,
          hasLoadedRemote: true,
        });
      },
    }),
    {
      name: "wird-app-data",
      storage: createJSONStorage(getPersistenceStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        readingSessions: state.readingSessions,
        reflectionNotes: state.reflectionNotes,
      }),
    },
  ),
);
