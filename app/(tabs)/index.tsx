import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../../constants/theme";
import {
  fetchChapterById,
  fetchChapters,
  fetchVerseRange,
  type QuranChapter,
  type QuranVerse,
} from "../../services/quranApi";
import {
  planDailyWird,
  type PlannedDailyWird,
} from "../../services/wirdEngine";
import { useAppDataStore } from "../../store/appDataStore";
import { useAuthStore } from "../../store/authStore";
import { useWirdStore } from "../../store/wirdStore";
import { useSettingsStore } from "../../store/settingsStore";

type HomeState = {
  chapter: QuranChapter | null;
  plannedWird: PlannedDailyWird | null;
  verses: QuranVerse[];
  isLoading: boolean;
  error: string | null;
};

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function getRecoveryHeadline(args: {
  missedDays: number;
  currentStreakDays: number;
  wasRecalibrated: boolean;
}) {
  if (args.currentStreakDays >= 7) {
    return "Your consistency is compounding.";
  }

  if (args.wasRecalibrated && args.missedDays >= 14) {
    return "Today is a fresh re-entry point.";
  }

  if (args.wasRecalibrated) {
    return "Your plan was softened, not broken.";
  }

  return "Your rhythm is holding steady.";
}

function getGreetingName(args: {
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
}) {
  const { displayName, email, isGuest } = args;

  if (displayName?.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }

  if (email?.trim()) {
    return email.trim().split("@")[0];
  }

  return isGuest ? "Friend" : "Reader";
}

export default function HomeScreen() {
  const toggleBookmark = useAppDataStore((store) => store.toggleBookmark);
  const isBookmarked = useAppDataStore((store) => store.isBookmarked);
  const readingSessions = useAppDataStore((store) => store.readingSessions);
  const readingLevel = useSettingsStore((store) => store.readingLevel);
  const showTranslation = readingLevel !== "advanced";
  const ensurePlan = useWirdStore((state) => state.ensurePlan);
  const plan = useWirdStore((state) => state.plan);
  const setToday = useWirdStore((state) => state.setToday);
  const displayName = useAuthStore((state) => state.displayName);
  const email = useAuthStore((state) => state.email);
  const isGuest = useAuthStore((state) => state.isGuest);
  const [state, setState] = useState<HomeState>({
    chapter: null,
    plannedWird: null,
    verses: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    ensurePlan();
  }, [ensurePlan]);

  useEffect(() => {
    if (!plan) {
      return;
    }

    let isActive = true;

    async function loadHomeContent() {
      try {
        const chapters = await fetchChapters();
        const plannedWird = await planDailyWird({
          chapters,
          plan,
          readingSessions,
        });
        const [chapter, verses] = await Promise.all([
          fetchChapterById(plannedWird.chapterNumber),
          fetchVerseRange(
            plannedWird.chapterNumber,
            plannedWird.startVerse,
            plannedWird.endVerse,
          ),
        ]);

        if (!isActive) {
          return;
        }

        setToday({
          date: new Date().toISOString().slice(0, 10),
          startVerseKey: plannedWird.startVerseKey,
          endVerseKey: plannedWird.endVerseKey,
          verseCount: plannedWird.verseCount,
          estimatedMinutes: plannedWird.estimatedMinutes,
          chapterName: plannedWird.chapterName,
          isCompleted: plannedWird.isCompletedToday,
          completedAt: plannedWird.completedAt,
          reflectionQuestion: null,
          encouragementMessage: plannedWird.encouragementMessage,
          aiRationale: plannedWird.aiRationale,
          wasRecalibrated: plannedWird.wasRecalibrated,
        });

        setState({
          chapter,
          plannedWird,
          verses,
          isLoading: false,
          error: null,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setState({
          chapter: null,
          plannedWird: null,
          verses: [],
          isLoading: false,
          error: "Today's plan could not be prepared. Please try again.",
        });
      }
    }

    void loadHomeContent();

    return () => {
      isActive = false;
    };
  }, [plan, readingSessions, setToday]);

  const primaryVerse = state.verses[0] ?? null;
  const chapterName = state.chapter?.nameSimple ?? state.plannedWird?.chapterName ?? "Quran";
  const chapterArabic =
    state.chapter?.nameArabic ?? state.plannedWird?.chapterArabic ?? "القرآن";
  const primaryVerseBookmarked = primaryVerse
    ? isBookmarked(primaryVerse.verseKey)
    : false;
  const greetingName = getGreetingName({
    displayName,
    email,
    isGuest,
  });

  const weekDays = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - offset));
      const dateKey = date.toISOString().slice(0, 10);

      return {
        id: dateKey,
        label: formatDayLabel(date),
        done: readingSessions.some((session) => session.completedAt.startsWith(dateKey)),
      };
    });
  }, [readingSessions]);

  const completedThisWeek = weekDays.filter((day) => day.done).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetRow}>
          <View style={styles.greetCopy}>
            <Text style={styles.greetLabel}>Assalamu Alaikum,</Text>
            <Text style={styles.greetName}>{greetingName}</Text>
            <Text style={styles.greetSubtle}>
              Your adaptive Quran routine for today
            </Text>
          </View>
          <View style={styles.greetMoon}>
            <Feather name="moon" size={24} color={colors.accentPrimary} />
          </View>
        </View>

        <View style={styles.wirdCard}>
          <View style={styles.wirdHeader}>
            <Text style={styles.wirdLabel}>Today's Wird</Text>
            <Text style={styles.wirdDay}>
              {state.plannedWird
                ? `Day ${state.plannedWird.dayNumber} of ${state.plannedWird.targetDays}`
                : "Calculating..."}
            </Text>
          </View>

          {state.isLoading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={colors.accentPrimary} />
              <Text style={styles.loadingText}>Building today&apos;s plan…</Text>
            </View>
          ) : state.error ? (
            <View style={styles.loadingBlock}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          ) : state.plannedWird ? (
            <>
              <View style={styles.titleBlock}>
                <Text style={styles.wirdTitle}>
                  {chapterName} {state.plannedWird.startVerse}–{state.plannedWird.endVerse}
                </Text>
                <Text style={styles.wirdMeta}>
                  {chapterArabic} · {state.plannedWird.verseCount} ayat · Est.{" "}
                  {state.plannedWird.estimatedMinutes} minutes
                </Text>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(state.plannedWird.progressPct, 6)}%` },
                    ]}
                  />
                </View>
                <View style={styles.wirdHeader}>
                  <Text style={styles.progressLabel}>
                    {state.plannedWird.progressPct}% of your goal completed
                  </Text>
                  <Text style={styles.progressJuz}>
                    Juz {primaryVerse?.juzNumber ?? 1}
                  </Text>
                </View>
              </View>

              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <Feather name="cpu" size={16} color={colors.accentPrimary} />
                  <Text style={styles.aiLabel}>AI Daily Plan</Text>
                </View>
                <Text style={styles.aiMessage}>
                  {state.plannedWird.encouragementMessage}
                </Text>
                <Text style={styles.aiReason}>
                  {state.plannedWird.aiRationale}
                </Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Pace</Text>
                  <Text style={styles.metricValue}>
                    {state.plannedWird.intensityLabel}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Current streak</Text>
                  <Text style={styles.metricValue}>
                    {state.plannedWird.currentStreakDays} day
                    {state.plannedWird.currentStreakDays === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Missed recently</Text>
                  <Text style={styles.metricValue}>
                    {state.plannedWird.missedDays}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.recoveryCard,
                  state.plannedWird.wasRecalibrated && styles.recoveryCardActive,
                ]}
              >
                <View style={styles.recoveryHeader}>
                  <Feather
                    name={state.plannedWird.wasRecalibrated ? "refresh-cw" : "check-circle"}
                    size={16}
                    color={
                      state.plannedWird.wasRecalibrated
                        ? colors.accentPrimary
                        : colors.accentGreen
                    }
                  />
                  <Text style={styles.recoveryTitle}>
                    {getRecoveryHeadline({
                      missedDays: state.plannedWird.missedDays,
                      currentStreakDays: state.plannedWird.currentStreakDays,
                      wasRecalibrated: state.plannedWird.wasRecalibrated,
                    })}
                  </Text>
                </View>
                <Text style={styles.recoveryText}>
                  {state.plannedWird.wasRecalibrated
                    ? `After ${state.plannedWird.missedDays} missed day${
                        state.plannedWird.missedDays === 1 ? "" : "s"
                      }, today's range was adjusted to ${state.plannedWird.verseCount} ayat so returning feels doable.`
                    : `You've stayed engaged, so today's plan keeps a ${state.plannedWird.intensityLabel.toLowerCase()} without unnecessary pressure.`}
                </Text>
              </View>

              <Link
                href={{
                  pathname: "/reader",
                  params: {
                    chapterNumber: String(state.plannedWird.chapterNumber),
                    startVerse: String(state.plannedWird.startVerse),
                    endVerse: String(state.plannedWird.endVerse),
                    chapterName,
                  },
                }}
                asChild
              >
                <Pressable style={styles.startBtn}>
                  <Feather
                    name={state.plannedWird.isCompletedToday ? "book-open" : "play"}
                    size={18}
                    color={colors.textInverse}
                  />
                  <Text style={styles.startBtnText}>
                    {state.plannedWird.isCompletedToday
                      ? "Review Today's Wird"
                      : "Start Wird"}
                  </Text>
                </Pressable>
              </Link>
            </>
          ) : null}
        </View>

        <View style={styles.ayahCard}>
          <View style={styles.wirdHeader}>
            <Text style={styles.wirdLabel}>Opening Ayah</Text>
            <Text style={styles.wirdDay}>{primaryVerse?.verseKey ?? "…"}</Text>
          </View>

          {primaryVerse ? (
            <>
              <Text style={styles.arabic}>{primaryVerse.arabicText}</Text>
              {showTranslation ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.translation}>
                    {primaryVerse.translationText ||
                      "Translation is not available for this ayah on the public feed."}
                  </Text>
                </>
              ) : null}
              <View style={styles.ayahActions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => {
                    toggleBookmark({
                      verseKey: primaryVerse.verseKey,
                      chapterName,
                      title: `${chapterName} ${primaryVerse.verseNumber}`,
                    });
                  }}
                >
                  <Feather
                    name="bookmark"
                    size={16}
                    color={
                      primaryVerseBookmarked
                        ? colors.accentPrimary
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      primaryVerseBookmarked && styles.actionLabelActive,
                    ]}
                  >
                    {primaryVerseBookmarked ? "Saved" : "Save ayah"}
                  </Text>
                </Pressable>
                <View style={styles.actionBtn}>
                  <Feather name="volume-2" size={16} color={colors.textMuted} />
                  <Text style={styles.actionLabel}>Listen in reader</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.translation}>
              Quran content will appear here after the plan is ready.
            </Text>
          )}
        </View>

        <View style={styles.weekCard}>
          <View style={styles.wirdHeader}>
            <Text style={styles.weekTitle}>This Week</Text>
            <Text style={styles.weekCount}>{completedThisWeek} of 7 days</Text>
          </View>
          <View style={styles.daysRow}>
            {weekDays.map((day) => (
              <View key={day.id} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: day.done
                        ? colors.accentGreen
                        : colors.border,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 24, paddingBottom: 24, gap: 24 },
  greetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetCopy: {
    gap: 4,
    flex: 1,
    paddingRight: 16,
  },
  greetLabel: { color: colors.textSecondary, fontSize: 14 },
  greetName: { color: colors.textPrimary, fontSize: 26, fontWeight: "700" },
  greetSubtle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  greetMoon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  wirdCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 24,
    gap: 16,
  },
  wirdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  wirdLabel: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  wirdDay: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
  titleBlock: { gap: 6 },
  wirdTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  wirdMeta: { color: colors.textSecondary, fontSize: 13 },
  progressSection: { gap: 8 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bgPrimary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.accentPrimary,
    borderRadius: 3,
  },
  progressLabel: {
    color: colors.accentPrimary,
    fontSize: 11,
    fontWeight: "500",
  },
  progressJuz: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  aiCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    padding: 14,
    gap: 8,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiLabel: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  aiMessage: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  aiReason: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  recoveryCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recoveryCardActive: {
    borderColor: colors.accentPrimary,
  },
  recoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recoveryTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  recoveryText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  startBtn: {
    height: 50,
    backgroundColor: colors.accentPrimary,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
  loadingBlock: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    lineHeight: 22,
  },
  ayahCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    padding: 24,
    gap: 16,
  },
  arabic: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 50,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  translation: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  ayahActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  actionLabelActive: {
    color: colors.accentPrimary,
  },
  weekCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  weekTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  weekCount: { color: colors.accentGreen, fontSize: 12, fontWeight: "500" },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: { alignItems: "center", gap: 6 },
  dayLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
});
