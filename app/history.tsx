import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../constants/theme";
import { useAppDataStore } from "../store/appDataStore";

type HistoryTab = "sessions" | "reflections";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HistoryTab>("sessions");
  const readingSessions = useAppDataStore((store) => store.readingSessions);
  const reflectionNotes = useAppDataStore((store) => store.reflectionNotes);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Reading sessions and reflections</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, activeTab === "sessions" && styles.toggleActive]}
          onPress={() => setActiveTab("sessions")}
        >
          <Text
            style={[
              styles.toggleLabel,
              activeTab === "sessions" && styles.toggleLabelActive,
            ]}
          >
            Sessions
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, activeTab === "reflections" && styles.toggleActive]}
          onPress={() => setActiveTab("reflections")}
        >
          <Text
            style={[
              styles.toggleLabel,
              activeTab === "reflections" && styles.toggleLabelActive,
            ]}
          >
            Reflections
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "sessions" ? (
          readingSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>
                Complete a reading flow and it will appear here.
              </Text>
            </View>
          ) : (
            readingSessions.map((session) => (
              <View key={session.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {session.chapterName} {session.startVerse}–{session.endVerse}
                  </Text>
                  <Text style={styles.cardMeta}>{session.verseCount} ayat</Text>
                </View>
                <Text style={styles.cardSubtle}>
                  {formatDate(session.completedAt)} · {session.estimatedMinutes} min
                </Text>
              </View>
            ))
          )
        ) : reflectionNotes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reflections yet</Text>
            <Text style={styles.emptyText}>
              Save a note after your reading and it will appear here.
            </Text>
          </View>
        ) : (
          reflectionNotes.map((note) => (
            <View key={note.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{note.verseRange}</Text>
                <Text style={styles.cardMeta}>{formatDate(note.createdAt)}</Text>
              </View>
              <Text style={styles.promptLabel}>Prompt</Text>
              <Text style={styles.promptText}>{note.prompt}</Text>
              <Text style={styles.noteLabel}>Your note</Text>
              <Text style={styles.noteText}>{note.note}</Text>
              <Text style={styles.sourceText}>Source · {note.tafsirSource}</Text>
            </View>
          ))
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
  headerCopy: { gap: 2 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.bgSecondary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: radii.full,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    paddingVertical: 12,
  },
  toggleActive: {
    backgroundColor: colors.accentPrimary,
  },
  toggleLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  toggleLabelActive: {
    color: colors.textInverse,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 24,
    gap: 10,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 18,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  cardMeta: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  cardSubtle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  promptLabel: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  promptText: {
    color: colors.textSecondary,
    lineHeight: 21,
  },
  noteLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  noteText: {
    color: colors.textPrimary,
    lineHeight: 22,
  },
  sourceText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
