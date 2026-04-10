import type {
  BookmarkRecord,
  RemoteAppData,
  ReadingSessionRecord,
  ReflectionNoteRecord,
  SettingsSyncPayload,
} from "../types/appData";
import { ensureSupabaseSession, supabase } from "../lib/supabase";
import {
  createQuranBookmark,
  removeQuranBookmarkByVerseKey,
  syncQuranActivityDay,
  syncQuranReadingSession,
} from "./quranUserApi";

async function withUserId<T extends Record<string, unknown>>(payload: T) {
  const session = await ensureSupabaseSession();

  if (!session?.user?.id) {
    return null;
  }

  return {
    ...payload,
    user_id: session.user.id,
  };
}

function logSyncFailure(action: string, error: unknown) {
  if (__DEV__) {
    console.log(`[Supabase Sync] ${action} failed`, error);
  }
}

function mapRemoteBookmark(record: {
  id: string;
  verse_key: string;
  chapter_name: string;
  title: string;
  created_at: string;
}): BookmarkRecord {
  return {
    id: record.id,
    verseKey: record.verse_key,
    chapterName: record.chapter_name,
    title: record.title,
    createdAt: record.created_at,
  };
}

function mapRemoteReadingSession(record: {
  id: string;
  chapter_number: number;
  chapter_name: string;
  start_verse: number;
  end_verse: number;
  verse_count: number;
  estimated_minutes: number;
  completed_at: string;
}): ReadingSessionRecord {
  return {
    id: record.id,
    chapterNumber: record.chapter_number,
    chapterName: record.chapter_name,
    startVerse: record.start_verse,
    endVerse: record.end_verse,
    verseCount: record.verse_count,
    estimatedMinutes: record.estimated_minutes,
    completedAt: record.completed_at,
  };
}

function mapRemoteReflectionNote(record: {
  id: string;
  chapter_number: number;
  chapter_name: string;
  start_verse: number;
  end_verse: number;
  verse_range: string;
  prompt: string;
  note: string;
  tafsir_source: string;
  created_at: string;
}): ReflectionNoteRecord {
  return {
    id: record.id,
    chapterNumber: record.chapter_number,
    chapterName: record.chapter_name,
    startVerse: record.start_verse,
    endVerse: record.end_verse,
    verseRange: record.verse_range,
    prompt: record.prompt,
    note: record.note,
    tafsirSource: record.tafsir_source,
    createdAt: record.created_at,
  };
}

export async function syncSettings(settings: SettingsSyncPayload) {
  if (!supabase) {
    return;
  }

  try {
    const payload = await withUserId({
      preferred_reciter: settings.preferredReciter,
      reading_level: settings.readingLevel,
      notification_time: settings.notificationTime,
      updated_at: new Date().toISOString(),
    });

    if (!payload) {
      return;
    }

    const { error } = await supabase.from("user_preferences").upsert(payload);

    if (error) {
      logSyncFailure("settings upsert", error.message);
    }
  } catch (error) {
    logSyncFailure("settings", error);
  }
}

export async function fetchRemoteSettings() {
  if (!supabase) {
    return null;
  }

  try {
    const session = await ensureSupabaseSession();

    if (!session?.user?.id) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      preferredReciter: data.preferred_reciter as number,
      readingLevel: data.reading_level as SettingsSyncPayload["readingLevel"],
      notificationTime: data.notification_time as string,
    } satisfies SettingsSyncPayload;
  } catch (error) {
    logSyncFailure("settings fetch", error);
    return null;
  }
}

export async function syncBookmark(bookmark: BookmarkRecord) {
  void createQuranBookmark(bookmark);
  await syncBookmarkToSupabase(bookmark);
}

async function syncBookmarkToSupabase(bookmark: BookmarkRecord) {
  if (!supabase) {
    return;
  }

  try {
    const payload = await withUserId({
      id: bookmark.id,
      verse_key: bookmark.verseKey,
      chapter_name: bookmark.chapterName,
      title: bookmark.title,
      created_at: bookmark.createdAt,
    });

    if (!payload) {
      return;
    }

    const { error } = await supabase.from("bookmarks").upsert(payload);

    if (error) {
      logSyncFailure("bookmark upsert", error.message);
    }
  } catch (error) {
    logSyncFailure("bookmark", error);
  }
}

export async function removeSyncedBookmark(id: string) {
  if (!supabase) {
    return;
  }

  try {
    const session = await ensureSupabaseSession();

    if (!session?.user?.id) {
      return;
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      logSyncFailure("bookmark delete", error.message);
    }
  } catch (error) {
    logSyncFailure("bookmark delete", error);
  }
}

export async function removeBookmarkEverywhere(input: {
  id: string;
  verseKey: string;
}) {
  await Promise.allSettled([
    removeSyncedBookmark(input.id),
    removeQuranBookmarkByVerseKey(input.verseKey),
  ]);
}

export async function syncReadingSession(session: ReadingSessionRecord) {
  void Promise.allSettled([
    syncQuranReadingSession(session),
    syncQuranActivityDay(session),
  ]);

  await syncReadingSessionToSupabase(session);
}

async function syncReadingSessionToSupabase(session: ReadingSessionRecord) {
  if (!supabase) {
    return;
  }

  try {
    const payload = await withUserId({
      id: session.id,
      chapter_number: session.chapterNumber,
      chapter_name: session.chapterName,
      start_verse: session.startVerse,
      end_verse: session.endVerse,
      verse_count: session.verseCount,
      estimated_minutes: session.estimatedMinutes,
      completed_at: session.completedAt,
    });

    if (!payload) {
      return;
    }

    const { error } = await supabase.from("reading_sessions").upsert(payload);

    if (error) {
      logSyncFailure("reading session upsert", error.message);
    }
  } catch (error) {
    logSyncFailure("reading session", error);
  }
}

export async function syncReflectionNote(note: ReflectionNoteRecord) {
  if (!supabase) {
    return;
  }

  try {
    const payload = await withUserId({
      id: note.id,
      chapter_number: note.chapterNumber,
      chapter_name: note.chapterName,
      start_verse: note.startVerse,
      end_verse: note.endVerse,
      verse_range: note.verseRange,
      prompt: note.prompt,
      note: note.note,
      tafsir_source: note.tafsirSource,
      created_at: note.createdAt,
    });

    if (!payload) {
      return;
    }

    const { error } = await supabase.from("reflection_notes").upsert(payload);

    if (error) {
      logSyncFailure("reflection note upsert", error.message);
    }
  } catch (error) {
    logSyncFailure("reflection note", error);
  }
}

export async function fetchRemoteAppData(): Promise<RemoteAppData | null> {
  if (!supabase) {
    return null;
  }

  try {
    const session = await ensureSupabaseSession();

    if (!session?.user?.id) {
      return null;
    }

    const [bookmarksResponse, sessionsResponse, reflectionsResponse] =
      await Promise.all([
        supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reading_sessions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("completed_at", { ascending: false }),
        supabase
          .from("reflection_notes")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

    if (bookmarksResponse.error) {
      logSyncFailure("bookmarks fetch", bookmarksResponse.error.message);
      return null;
    }

    if (sessionsResponse.error) {
      logSyncFailure("reading sessions fetch", sessionsResponse.error.message);
      return null;
    }

    if (reflectionsResponse.error) {
      logSyncFailure("reflection notes fetch", reflectionsResponse.error.message);
      return null;
    }

    return {
      bookmarks: (bookmarksResponse.data ?? []).map(mapRemoteBookmark),
      readingSessions: (sessionsResponse.data ?? []).map(mapRemoteReadingSession),
      reflectionNotes: (reflectionsResponse.data ?? []).map(mapRemoteReflectionNote),
    };
  } catch (error) {
    logSyncFailure("app data fetch", error);
    return null;
  }
}

export async function backfillRemoteAppData(appData: RemoteAppData) {
  await Promise.all([
    ...appData.bookmarks.map((bookmark) => syncBookmarkToSupabase(bookmark)),
    ...appData.readingSessions.map((session) => syncReadingSessionToSupabase(session)),
    ...appData.reflectionNotes.map((note) => syncReflectionNote(note)),
  ]);
}

export async function backfillRemoteSettings(settings: SettingsSyncPayload) {
  await syncSettings(settings);
}
