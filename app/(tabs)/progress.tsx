import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { colors, radii } from "../../constants/theme";
import { useAppDataStore } from "../../store/appDataStore";

const TOTAL_QURAN_VERSES = 6236;

function ProgressRing({ progress }: { progress: number }) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accentPrimary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={styles.ringValue}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.ringCaption}>complete</Text>
      </View>
    </View>
  );
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function ProgressScreen() {
  const router = useRouter();
  const readingSessions = useAppDataStore((store) => store.readingSessions);
  const bookmarks = useAppDataStore((store) => store.bookmarks);
  const reflectionNotes = useAppDataStore((store) => store.reflectionNotes);

  const completedVerses = readingSessions.reduce(
    (sum, session) => sum + session.verseCount,
    0,
  );
  const progress = Math.min(completedVerses / TOTAL_QURAN_VERSES, 1);

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - offset));
    const dateKey = date.toISOString().slice(0, 10);
    const done = readingSessions.some((session) =>
      session.completedAt.startsWith(dateKey),
    );

    return {
      label: formatDayLabel(date),
      done,
    };
  });

  const daysCompleted = weekDays.filter((day) => day.done).length;
  const milestones = [
    {
      label: "First session completed",
      done: readingSessions.length >= 1,
    },
    {
      label: "Saved first ayah",
      done: bookmarks.length >= 1,
    },
    {
      label: "First reflection note",
      done: reflectionNotes.length >= 1,
    },
    {
      label: "Seven reading sessions",
      done: readingSessions.length >= 7,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Journey</Text>

        <View style={styles.ringCard}>
          <ProgressRing progress={progress} />
          <Text style={styles.goalText}>
            {completedVerses} of {TOTAL_QURAN_VERSES} ayat completed
          </Text>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.weekCount}>{daysCompleted} of 7 days</Text>
          </View>
          <View style={styles.daysGrid}>
            {weekDays.map((day) => (
              <View key={day.label} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    day.done ? styles.dayDone : styles.dayEmpty,
                  ]}
                >
                  {day.done ? (
                    <Feather name="check" size={14} color={colors.accentGreen} />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.milesCard}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {milestones.map((milestone) => (
            <View key={milestone.label} style={styles.milestoneRow}>
              <View
                style={[
                  styles.milestoneCircle,
                  milestone.done ? styles.milestoneDone : styles.milestoneEmpty,
                ]}
              >
                {milestone.done ? (
                  <Feather name="check" size={14} color={colors.accentGreen} />
                ) : (
                  <View style={styles.milestoneDot} />
                )}
              </View>
              <Text
                style={[
                  styles.milestoneLabel,
                  !milestone.done && { color: colors.textMuted },
                ]}
              >
                {milestone.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.bookmarkCard}>
          <View style={styles.bookmarkLeft}>
            <Feather name="bookmark" size={20} color={colors.accentPrimary} />
            <Text style={styles.bookmarkLabel}>Bookmarked Ayat</Text>
          </View>
          <Text style={styles.bookmarkCount}>{bookmarks.length}</Text>
        </View>

        <Pressable style={styles.historyCard} onPress={() => router.push("/history")}>
          <View style={styles.historyCopy}>
            <Text style={styles.historyTitle}>History and reflections</Text>
            <Text style={styles.historySubtitle}>
              Open your saved sessions, AI prompts, and private reflection notes.
            </Text>
          </View>
          <View style={styles.historyMeta}>
            <Text style={styles.historyCount}>
              {readingSessions.length + reflectionNotes.length} items
            </Text>
            <Feather name="arrow-right" size={18} color={colors.accentPrimary} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 20, paddingTop: 24, paddingBottom: 24, gap: 24 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  ringCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ringValue: {
    color: colors.accentPrimary,
    fontSize: 32,
    fontWeight: "700",
  },
  ringCaption: { color: colors.textMuted, fontSize: 12 },
  goalText: { color: colors.textSecondary, fontSize: 14, fontWeight: "500" },
  weekCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  weekCount: { color: colors.accentGreen, fontSize: 13, fontWeight: "500" },
  daysGrid: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", gap: 8 },
  dayLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDone: { backgroundColor: "rgba(64, 184, 130, 0.15)" },
  dayEmpty: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  milesCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 14,
  },
  milestoneRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  milestoneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneDone: { backgroundColor: "rgba(64, 184, 130, 0.15)" },
  milestoneEmpty: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  milestoneLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  bookmarkCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  bookmarkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bookmarkLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  bookmarkCount: {
    color: colors.accentPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  historyCopy: { flex: 1, gap: 6 },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  historySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  historyMeta: { alignItems: "flex-end", gap: 8 },
  historyCount: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
