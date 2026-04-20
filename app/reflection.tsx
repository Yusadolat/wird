import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../constants/theme";
import { fetchTafsirByAyah } from "../services/quranApi";
import { generateReflectionQuestion } from "../services/reflectionService";
import { useAppDataStore } from "../store/appDataStore";

type ReflectionState = {
  question: string;
  tafsirExcerpt: string;
  resourceName: string;
  isLoading: boolean;
  error: string | null;
};

function buildVerseKeys(chapterNumber: number, startVerse: number, endVerse: number) {
  return Array.from(
    { length: Math.max(endVerse - startVerse + 1, 1) },
    (_, index) => `${chapterNumber}:${startVerse + index}`,
  );
}

export default function ReflectionScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const params = useLocalSearchParams<{
    chapterNumber?: string;
    chapterName?: string;
    startVerse?: string;
    endVerse?: string;
    verseCount?: string;
  }>();

  const chapterNumber = Number(params.chapterNumber ?? "2");
  const chapterName = params.chapterName ?? "Al-Baqarah";
  const startVerse = Number(params.startVerse ?? "1");
  const endVerse = Number(params.endVerse ?? "10");
  const verseCount = Number(params.verseCount ?? String(endVerse - startVerse + 1));
  const verseRange = `${chapterName} ${startVerse}–${endVerse}`;

  const verseKeys = useMemo(
    () => buildVerseKeys(chapterNumber, startVerse, endVerse),
    [chapterNumber, endVerse, startVerse],
  );

  const [note, setNote] = useState("");
  const addReadingSession = useAppDataStore((store) => store.addReadingSession);
  const addReflectionNote = useAppDataStore((store) => store.addReflectionNote);
  const [state, setState] = useState<ReflectionState>({
    question:
      "What does this passage invite to change in a concrete part of life today?",
    tafsirExcerpt: "",
    resourceName: "Ibn Kathir",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadReflection() {
      try {
        const tafsirs = await Promise.all(
          verseKeys.map((verseKey) => fetchTafsirByAyah(verseKey)),
        );

        const combinedTafsir = tafsirs
          .map((tafsir) => tafsir.text)
          .join(" ")
          .trim();
        const excerpt = combinedTafsir.slice(0, 900).trim();

        let question =
          "What does this passage invite to change in a concrete part of life today?";

        try {
          question = await generateReflectionQuestion(excerpt, verseRange);
        } catch {
          question =
            "What does this passage invite to change in a concrete part of life today?";
        }

        if (!isActive) {
          return;
        }

        setState({
          question,
          tafsirExcerpt: excerpt,
          resourceName: tafsirs[0]?.resourceName ?? "Ibn Kathir",
          isLoading: false,
          error: null,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setState({
          question:
            "What does this passage invite to change in a concrete part of life today?",
          tafsirExcerpt: "",
          resourceName: "Ibn Kathir",
          isLoading: false,
          error: "Unable to load tafsir right now.",
        });
      }
    }

    void loadReflection();

    return () => {
      isActive = false;
    };
  }, [verseKeys, verseRange]);

  function handleDone() {
    addReadingSession({
      chapterNumber,
      chapterName,
      startVerse,
      endVerse,
      verseCount,
      estimatedMinutes: 8,
    });

    if (note.trim()) {
      addReflectionNote({
        chapterNumber,
        chapterName,
        startVerse,
        endVerse,
        verseRange,
        prompt: state.question,
        note: note.trim(),
        tafsirSource: state.resourceName,
      });
    }

    router.replace("/(tabs)");
  }

  function handleNoteFocus() {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          <View style={styles.checkCircle}>
            <Feather name="check" size={36} color={colors.accentGreen} />
          </View>

          <Text style={styles.mashaAllah}>MashaAllah!</Text>
          <Text style={styles.sessionComplete}>Session Complete</Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{verseCount}</Text>
              <Text style={styles.statLabel}>Ayat Read</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Live</Text>
              <Text style={styles.statLabel}>Tafsir Source</Text>
            </View>
          </View>

          <View style={styles.reflectCard}>
            <View style={styles.reflectHeader}>
              <Feather name="star" size={16} color={colors.accentPrimary} />
              <Text style={styles.reflectLabel}>AI Reflection</Text>
            </View>
            <Text style={styles.reflectContext}>
              Based on today's reading ({verseRange})
            </Text>

            {state.isLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={colors.accentPrimary} />
                <Text style={styles.loadingText}>
                  Building a tafsir-grounded reflection…
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.reflectQuestion}>
                  {"\u201C"}
                  {state.question}
                  {"\u201D"}
                </Text>

                <View style={styles.sourceBlock}>
                  <Text style={styles.sourceLabel}>
                    Source excerpt · {state.resourceName}
                  </Text>
                  <Text style={styles.sourceText}>
                    {state.tafsirExcerpt ||
                      "Tafsir could not be loaded for this passage."}
                  </Text>
                </View>

                {state.error ? (
                  <Text style={styles.errorText}>{state.error}</Text>
                ) : null}
              </>
            )}

            <View style={styles.noteInput}>
              <Feather name="edit-3" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.noteText}
                placeholder="Write a personal reflection..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={note}
                onChangeText={setNote}
                onFocus={handleNoteFocus}
              />
            </View>
          </View>

          <Pressable
            style={styles.doneBtn}
            onPress={handleDone}
          >
            <Text style={styles.doneBtnText}>Done</Text>
            <Feather name="arrow-right" size={18} color={colors.textInverse} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 28,
    alignItems: "center",
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(64, 184, 130, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mashaAllah: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginTop: -12,
  },
  sessionComplete: {
    color: colors.accentGreen,
    fontSize: 16,
    fontWeight: "500",
    marginTop: -16,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: "100%",
  },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statValue: {
    color: colors.accentPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "500" },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  reflectCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    padding: 24,
    gap: 16,
    width: "100%",
  },
  reflectHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reflectLabel: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  reflectContext: { color: colors.textMuted, fontSize: 13 },
  loadingBlock: {
    paddingVertical: 20,
    gap: 10,
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  reflectQuestion: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 26,
    fontStyle: "italic",
  },
  sourceBlock: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  sourceLabel: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  sourceText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
  noteInput: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accentPrimary,
    borderRadius: radii.md,
    height: 52,
    width: "100%",
  },
  doneBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
