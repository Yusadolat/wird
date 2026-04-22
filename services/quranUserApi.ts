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
    createdAt?: string;
    isInDefaultCollection?: boolean;
  }>;
  pagination?: {
    endCursor?: string;
    hasNextPage?: boolean;
  };
  message?: string;
};

type QuranReadingSessionsResponse = {
  success: boolean;
  data?: unknown[];
  message?: string;
};

type QuranActivityDaysResponse = {
  success: boolean;
  data?: unknown[];
  message?: string;
};

export type QuranRemoteBookmark = {
  id: string;
  chapterNumber: number;
  verseNumber: number;
  verseKey: string;
  createdAt: string | null;
  isInDefaultCollection: boolean;
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

function mapQuranRemoteBookmark(
  item: NonNullable<QuranBookmarksResponse["data"]>[number],
) {
  if (item.type !== "ayah" || !item.key || !item.verseNumber) {
    return null;
  }

  return {
    id: item.id,
    chapterNumber: item.key,
    verseNumber: item.verseNumber,
    verseKey: `${item.key}:${item.verseNumber}`,
    createdAt: item.createdAt ?? null,
    isInDefaultCollection: item.isInDefaultCollection ?? false,
  } satisfies QuranRemoteBookmark;
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

export async function fetchQuranBookmarks(limit = 20) {
  try {
    const bookmarks: QuranRemoteBookmark[] = [];
    let after: string | undefined;
    let hasNextPage = true;

    while (bookmarks.length < limit && hasNextPage) {
      const query = new URLSearchParams({
        type: "ayah",
        mushafId: String(DEFAULT_MUSHAF_ID),
        first: String(Math.min(20, limit - bookmarks.length)),
      });

      if (after) {
        query.set("after", after);
      }

      const response = await quranUserRequest<QuranBookmarksResponse>(
        `/bookmarks?${query.toString()}`,
      );

      if (!response?.data?.length) {
        break;
      }

      for (const item of response.data) {
        const bookmark = mapQuranRemoteBookmark(item);

        if (bookmark) {
          bookmarks.push(bookmark);
        }
      }

      after = response.pagination?.endCursor;
      hasNextPage = Boolean(response.pagination?.hasNextPage && after);
    }

    return bookmarks;
  } catch (error) {
    logQuranUserSyncFailure("bookmark fetch", error);
    throw error;
  }
}

export async function fetchQuranReadingSessions(limit = 10) {
  try {
    const query = new URLSearchParams({
      first: String(Math.min(Math.max(limit, 1), 20)),
    });
    const response = await quranUserRequest<QuranReadingSessionsResponse>(
      `/reading-sessions?${query.toString()}`,
    );

    return response?.data ?? [];
  } catch (error) {
    logQuranUserSyncFailure("reading sessions fetch", error);
    throw error;
  }
}

export async function fetchQuranActivityDays(params: {
  from: string;
  to: string;
  limit?: number;
}) {
  try {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
      type: "QURAN",
      dateOrderBy: "desc",
      first: String(Math.min(Math.max(params.limit ?? 20, 1), 20)),
    });
    const response = await quranUserRequest<QuranActivityDaysResponse>(
      `/activity-days?${query.toString()}`,
      { includeTimezone: true },
    );

    return response?.data ?? [];
  } catch (error) {
    logQuranUserSyncFailure("activity days fetch", error);
    throw error;
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
