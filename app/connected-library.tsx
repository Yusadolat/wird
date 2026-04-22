import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../constants/theme";
import { fetchChapters, type QuranChapter } from "../services/quranApi";
import {
  fetchQuranActivityDays,
  fetchQuranBookmarks,
  fetchQuranReadingSessions,
  type QuranRemoteBookmark,
} from "../services/quranUserApi";
import { useAppDataStore } from "../store/appDataStore";
import { useAuthStore } from "../store/authStore";
import type { BookmarkRecord } from "../types/appData";

type RemoteBookmarkView = QuranRemoteBookmark & {
  chapterName: string;
  chapterArabic: string;
  title: string;
};

type ConnectedLibraryState = {
  bookmarks: RemoteBookmarkView[];
  recentSessionCount: number;
  activityDayCount: number;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  importMessage: string | null;
  lastCheckedAt: string | null;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLastChecked(value: string | null) {
  if (!value) {
    return "Not checked yet";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildChapterMap(chapters: QuranChapter[]) {
  return new Map(chapters.map((chapter) => [chapter.id, chapter]));
}

function mapRemoteBookmarks(
  bookmarks: QuranRemoteBookmark[],
  chapters: QuranChapter[],
) {
  const chapterById = buildChapterMap(chapters);

  return bookmarks.map((bookmark) => {
    const chapter = chapterById.get(bookmark.chapterNumber);
    const chapterName = chapter?.nameSimple ?? `Surah ${bookmark.chapterNumber}`;

    return {
      ...bookmark,
      chapterName,
      chapterArabic: chapter?.nameArabic ?? "القرآن",
      title: `${chapterName} ${bookmark.verseNumber}`,
    } satisfies RemoteBookmarkView;
  });
}

function toImportedBookmark(bookmark: RemoteBookmarkView): BookmarkRecord {
  return {
    id: `qf-${bookmark.id}`,
    verseKey: bookmark.verseKey,
    chapterName: bookmark.chapterName,
    title: bookmark.title,
    createdAt: bookmark.createdAt ?? new Date().toISOString(),
  };
}

function StatusMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Feather name={icon} size={16} color={colors.accentPrimary} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export default function ConnectedLibraryScreen() {
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const displayName = useAuthStore((state) => state.displayName);
  const email = useAuthStore((state) => state.email);
  const localBookmarks = useAppDataStore((store) => store.bookmarks);
  const readingSessions = useAppDataStore((store) => store.readingSessions);
  const mergeImportedBookmarks = useAppDataStore(
    (store) => store.mergeImportedBookmarks,
  );
  const [state, setState] = useState<ConnectedLibraryState>({
    bookmarks: [],
    recentSessionCount: 0,
    activityDayCount: 0,
    isLoading: false,
    isImporting: false,
    error: null,
    importMessage: null,
    lastCheckedAt: null,
  });

  const loadConnectedLibrary = useCallback(async () => {
    if (isGuest) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: null,
        bookmarks: [],
        recentSessionCount: 0,
        activityDayCount: 0,
      }));
      return;
    }

    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - 30);

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
      importMessage: null,
    }));

    try {
      const [remoteBookmarks, recentSessions, activityDays, chapters] =
        await Promise.all([
          fetchQuranBookmarks(20),
          fetchQuranReadingSessions(10),
          fetchQuranActivityDays({
            from: formatDateKey(from),
            to: formatDateKey(to),
            limit: 20,
          }),
          fetchChapters(),
        ]);

      setState((current) => ({
        ...current,
        bookmarks: mapRemoteBookmarks(remoteBookmarks, chapters),
        recentSessionCount: recentSessions.length,
        activityDayCount: activityDays.length,
        isLoading: false,
        error: null,
        lastCheckedAt: new Date().toISOString(),
      }));
    } catch {
      setState((current) => ({
        ...current,
        isLoading: false,
        error:
          "Quran.com library could not be checked. Your local saved ayat are still available.",
      }));
    }
  }, [isGuest]);

  useEffect(() => {
    void loadConnectedLibrary();
  }, [loadConnectedLibrary]);

  function handleImport() {
    setState((current) => ({
      ...current,
      isImporting: true,
      importMessage: null,
    }));

    const result = mergeImportedBookmarks(state.bookmarks.map(toImportedBookmark));

    setState((current) => ({
      ...current,
      isImporting: false,
      importMessage:
        result.addedCount === 0
          ? "Your Quran.com bookmarks are already in Saved."
          : `Imported ${result.addedCount} bookmark${
              result.addedCount === 1 ? "" : "s"
            } into Saved.`,
    }));
  }

  const accountLabel = displayName ?? email ?? "Quran.com account";
  const newBookmarkCount = state.bookmarks.filter(
    (bookmark) =>
      !localBookmarks.some((local) => local.verseKey === bookmark.verseKey),
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Connected Library</Text>
          <Text style={styles.subtitle}>
            Quran.com bookmarks, sessions, and activity days
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.connectionIcon}>
              <Feather
                name={isGuest ? "cloud-off" : "cloud"}
                size={20}
                color={colors.accentPrimary}
              />
            </View>
            <View style={styles.connectionCopy}>
              <Text style={styles.connectionTitle}>
                {isGuest ? "Guest mode" : accountLabel}
              </Text>
              <Text style={styles.connectionText}>
                {isGuest
                  ? "Sign in to connect saved ayat with the Quran.Foundation ecosystem."
                  : `Last checked ${formatLastChecked(state.lastCheckedAt)}`}
              </Text>
            </View>
          </View>

          {isGuest ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Feather name="log-in" size={16} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>Sign in with Quran.com</Text>
            </Pressable>
          ) : (
            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void loadConnectedLibrary()}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <ActivityIndicator size="small" color={colors.accentPrimary} />
                ) : (
                  <Feather name="refresh-cw" size={16} color={colors.accentPrimary} />
                )}
                <Text style={styles.secondaryButtonText}>Check now</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  state.bookmarks.length === 0 && styles.primaryButtonDisabled,
                ]}
                onPress={handleImport}
                disabled={state.bookmarks.length === 0 || state.isImporting}
              >
                {state.isImporting ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Feather name="download-cloud" size={16} color={colors.textInverse} />
                )}
                <Text style={styles.primaryButtonText}>Import</Text>
              </Pressable>
            </View>
          )}

          {state.error ? <Text style={styles.errorText}>{state.error}</Text> : null}
          {state.importMessage ? (
            <Text style={styles.successText}>{state.importMessage}</Text>
          ) : null}
        </View>

        <View style={styles.metricsGrid}>
          <StatusMetric
            icon="bookmark"
            label="Quran.com bookmarks"
            value={String(state.bookmarks.length)}
            detail={`${newBookmarkCount} new for Saved`}
          />
          <StatusMetric
            icon="clock"
            label="Recent sessions"
            value={String(state.recentSessionCount)}
            detail={`${readingSessions.length} local in Wird`}
          />
          <StatusMetric
            icon="calendar"
            label="Activity days"
            value={String(state.activityDayCount)}
            detail="Last 30 days"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Remote Saved Ayat</Text>
          <Text style={styles.sectionMeta}>
            {state.isLoading ? "Checking…" : `${state.bookmarks.length} shown`}
          </Text>
        </View>

        {state.isLoading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={colors.accentPrimary} />
            <Text style={styles.emptyTitle}>Checking Quran.com</Text>
            <Text style={styles.emptyText}>
              Wird is reading your connected bookmarks and progress.
            </Text>
          </View>
        ) : state.bookmarks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="bookmark" size={24} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {isGuest ? "Sign in to load bookmarks" : "No Quran.com bookmarks found"}
            </Text>
            <Text style={styles.emptyText}>
              {isGuest
                ? "Your local Saved tab still works in guest mode."
                : "Save ayat in Quran.com or Wird and check again."}
            </Text>
          </View>
        ) : (
          <View style={styles.bookmarkList}>
            {state.bookmarks.map((bookmark) => (
              <View key={bookmark.id} style={styles.bookmarkRow}>
                <View style={styles.bookmarkIcon}>
                  <Feather name="bookmark" size={15} color={colors.accentPrimary} />
                </View>
                <View style={styles.bookmarkCopy}>
                  <Text style={styles.bookmarkKey}>{bookmark.verseKey}</Text>
                  <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
                  <Text style={styles.bookmarkSubtle}>{bookmark.chapterArabic}</Text>
                  <View style={styles.bookmarkActions}>
                    <Link
                      href={{
                        pathname: "/reader",
                        params: {
                          chapterNumber: String(bookmark.chapterNumber),
                          startVerse: String(bookmark.verseNumber),
                          endVerse: String(bookmark.verseNumber),
                          chapterName: bookmark.chapterName,
                        },
                      }}
                      asChild
                    >
                      <Pressable style={styles.smallAction}>
                        <Feather
                          name="book-open"
                          size={14}
                          color={colors.accentPrimary}
                        />
                        <Text style={styles.smallActionText}>Read</Text>
                      </Pressable>
                    </Link>
                    <Link
                      href={{
                        pathname: "/reflection",
                        params: {
                          chapterNumber: String(bookmark.chapterNumber),
                          chapterName: bookmark.chapterName,
                          startVerse: String(bookmark.verseNumber),
                          endVerse: String(bookmark.verseNumber),
                          verseCount: "1",
                        },
                      }}
                      asChild
                    >
                      <Pressable style={styles.smallAction}>
                        <Feather name="edit-3" size={14} color={colors.accentPrimary} />
                        <Text style={styles.smallActionText}>Reflect</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  connectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  connectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectionCopy: { flex: 1, gap: 4 },
  connectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  connectionText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: { flexDirection: "row", gap: 12 },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.md,
    backgroundColor: colors.accentPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    backgroundColor: colors.bgCard,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
  successText: {
    color: colors.accentGreen,
    fontSize: 13,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 146,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 12,
    gap: 6,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  metricDetail: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 28,
    gap: 12,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  bookmarkList: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  bookmarkRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookmarkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkCopy: { flex: 1, gap: 4 },
  bookmarkKey: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  bookmarkTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  bookmarkSubtle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bookmarkActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
  },
  smallAction: {
    minHeight: 34,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  smallActionText: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
