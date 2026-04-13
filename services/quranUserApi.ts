import { getQuranClientId } from "./quranAuthService";
import { useAuthStore } from "../store/authStore";
import type { BookmarkRecord, ReadingSessionRecord } from "../types/appData";
import { config } from "../lib/config";
import { captureException } from "../lib/sentry";

const PRODUCTION_USER_API_BASE_URL = "https://apis.quran.foundation/auth/v1";
const PRELIVE_USER_API_BASE_URL = "https://apis-prelive.quran.foundation/auth/v1";
const DEFAULT_MUSHAF_ID = 4;

type QuranBookmarksResponse = {
  success: boolean;
  data?: Array<{
    id: string;
    key: number;
    verseNumber?: number;
    type: string;
  }>;
  message?: string;
};

function getQuranUserApiBaseUrl() {
  return config.useProduction
    ? PRODUCTION_USER_API_BASE_URL
    : PRELIVE_USER_API_BASE_URL;
}

function getQuranTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getSignedInAccessToken() {
  const session = useAuthStore.getState();

  if (!session.accessToken || session.isGuest) {
    return null;
  }

  return session.accessToken;
}

function parseVerseKey(verseKey: string) {
  const [chapterPart, versePart] = verseKey.split(":");
  const chapterNumber = Number(chapterPart);
  const verseNumber = Number(versePart);

  if (!chapterNumber || !verseNumber) {
    throw new Error(`Invalid verse key: ${verseKey}`);
  }

  return { chapterNumber, verseNumber };
}

async function quranUserRequest<T>(
  path: string,
  init: RequestInit & { includeTimezone?: boolean } = {},
) {
  const accessToken = getSignedInAccessToken();

  if (!accessToken) {
    return null;
  }

  const headers = new Headers(init.headers);
  headers.set("x-auth-token", accessToken);
  headers.set("x-client-id", getQuranClientId());

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init.includeTimezone) {
    headers.set("x-timezone", getQuranTimezone());
  }

  const response = await fetch(`${getQuranUserApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T & { message?: string })
    : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : `Quran user API request failed (${response.status})`;

    throw new Error(message ?? `Quran user API request failed (${response.status})`);
  }

  return payload;
}

function logQuranUserSyncFailure(action: string, error: unknown) {
  if (config.sentryCaptureHandled) {
    captureException(error, {
      tags: { area: "quran_user_api", action },
    });
  }

  if (__DEV__) {
    console.log(`[Quran User API] ${action} failed`, error);
  }
}

export async function createQuranBookmark(bookmark: BookmarkRecord) {
  try {
    const { chapterNumber, verseNumber } = parseVerseKey(bookmark.verseKey);

    await quranUserRequest("/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        type: "ayah",
        key: chapterNumber,
        verseNumber,
        mushaf: DEFAULT_MUSHAF_ID,
      }),
    });
  } catch (error) {
    logQuranUserSyncFailure("bookmark create", error);
  }
}

export async function removeQuranBookmarkByVerseKey(verseKey: string) {
  try {
    const { chapterNumber, verseNumber } = parseVerseKey(verseKey);
    const query = new URLSearchParams({
      type: "ayah",
      key: String(chapterNumber),
      mushafId: String(DEFAULT_MUSHAF_ID),
      first: "20",
    });

    const bookmarks = await quranUserRequest<QuranBookmarksResponse>(
      `/bookmarks?${query.toString()}`,
    );

    if (!bookmarks?.data?.length) {
      return;
    }

    const bookmarkToDelete = bookmarks.data.find(
      (item) => item.type === "ayah" && item.verseNumber === verseNumber,
    );

    if (!bookmarkToDelete?.id) {
      return;
    }

    await quranUserRequest(`/bookmarks/${bookmarkToDelete.id}`, {
      method: "DELETE",
    });
  } catch (error) {
    logQuranUserSyncFailure("bookmark delete", error);
  }
}

export async function syncQuranReadingSession(session: ReadingSessionRecord) {
  try {
    await quranUserRequest("/reading-sessions", {
      method: "POST",
      body: JSON.stringify({
        chapterNumber: session.chapterNumber,
        verseNumber: session.endVerse,
      }),
    });
  } catch (error) {
    logQuranUserSyncFailure("reading session", error);
  }
}

export async function syncQuranActivityDay(session: ReadingSessionRecord) {
  try {
    const seconds = Math.max(Math.round(session.estimatedMinutes * 60), 60);

    await quranUserRequest("/activity-days", {
      method: "POST",
      includeTimezone: true,
      body: JSON.stringify({
        type: "QURAN",
        seconds,
        ranges: [
          `${session.chapterNumber}:${session.startVerse}-${session.chapterNumber}:${session.endVerse}`,
        ],
        mushafId: DEFAULT_MUSHAF_ID,
        date: session.completedAt.slice(0, 10),
      }),
    });
  } catch (error) {
    logQuranUserSyncFailure("activity day", error);
  }
}
