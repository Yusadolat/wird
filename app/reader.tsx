import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AudioPlayer } from "../components/AudioPlayer";
import { colors, radii } from "../constants/theme";
import {
  fetchTafsirByAyah,
  fetchVerseAudioUrl,
  fetchVerseRange,
  type QuranVerse,
} from "../services/quranApi";
import { useAppDataStore } from "../store/appDataStore";
import { useSettingsStore } from "../store/settingsStore";

type ReaderState = {
  verses: QuranVerse[];
  isLoading: boolean;
  error: string | null;
};

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chapterNumber?: string;
    startVerse?: string;
    endVerse?: string;
    chapterName?: string;
  }>();

  const chapterNumber = Number(params.chapterNumber ?? "2");
  const startVerse = Number(params.startVerse ?? "1");
  const endVerse = Number(params.endVerse ?? "10");
  const chapterName = params.chapterName ?? "Al-Baqarah";

  const [state, setState] = useState<ReaderState>({
    verses: [],
    isLoading: true,
    error: null,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isTafsirOpen, setIsTafsirOpen] = useState(false);
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirSource, setTafsirSource] = useState("Ibn Kathir");
  const [isTafsirLoading, setIsTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const toggleBookmark = useAppDataStore((store) => store.toggleBookmark);
  const isBookmarked = useAppDataStore((store) => store.isBookmarked);
  const readingLevel = useSettingsStore((store) => store.readingLevel);
  const preferredReciter = useSettingsStore((store) => store.preferredReciter);
  const showTranslation = readingLevel !== "advanced";

  useEffect(() => {
    let isActive = true;

    async function loadReaderContent() {
      try {
        const verses = await fetchVerseRange(chapterNumber, startVerse, endVerse);

        if (!isActive) {
          return;
        }

        setState({
          verses,
          isLoading: false,
          error: null,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setState({
          verses: [],
          isLoading: false,
          error: "This passage could not be loaded. Please try again.",
        });
      }
    }

    void loadReaderContent();

    return () => {
      isActive = false;
    };
  }, [chapterNumber, endVerse, startVerse]);

  const totalVerses = state.verses.length;
  const currentVerse = state.verses[currentIndex] ?? null;

  useEffect(() => {
    let isActive = true;

    async function loadVerseAudio() {
      if (!currentVerse) {
        setCurrentAudioUrl(null);
        setAudioError(null);
        return;
      }

      try {
        setAudioError(null);
        const audioUrl = await fetchVerseAudioUrl(
          preferredReciter,
          currentVerse.verseKey,
        );

        if (!isActive) {
          return;
        }

        setCurrentAudioUrl(audioUrl);

        if (!audioUrl) {
          setAudioError("Audio is not available for this ayah yet.");
        }
      } catch {
        if (!isActive) {
          return;
        }

        setCurrentAudioUrl(null);
        setAudioError("Ayah audio could not be loaded. Please try again.");
      }
    }

    void loadVerseAudio();

    return () => {
      isActive = false;
    };
  }, [currentVerse, preferredReciter]);

  useEffect(() => {
    if (!isTafsirOpen || !currentVerse) {
      return;
    }

    let isActive = true;

    async function loadTafsir() {
      try {
        setIsTafsirLoading(true);
        setTafsirError(null);

        const tafsir = await fetchTafsirByAyah(currentVerse.verseKey);

        if (!isActive) {
          return;
        }

        setTafsirSource(tafsir.resourceName);
        setTafsirText(tafsir.text);
        setIsTafsirLoading(false);
      } catch {
        if (!isActive) {
          return;
        }

        setTafsirText("");
        setIsTafsirLoading(false);
        setTafsirError("Tafsir could not be loaded for this ayah.");
      }
    }

    void loadTafsir();

    return () => {
      isActive = false;
    };
  }, [currentVerse, isTafsirOpen]);

  const currentVerseBookmarked = currentVerse
    ? isBookmarked(currentVerse.verseKey)
    : false;

  function handleNext() {
    if (!currentVerse) {
      return;
    }

    if (currentIndex < totalVerses - 1) {
      setCurrentIndex((value) => value + 1);
      return;
    }

    router.push({
      pathname: "/reflection",
      params: {
        chapterNumber: String(chapterNumber),
        chapterName,
        startVerse: String(startVerse),
        endVerse: String(endVerse),
        verseCount: String(totalVerses),
      },
    });
  }

  function handlePrevious() {
    if (currentIndex === 0) {
      router.back();
      return;
    }

    setCurrentIndex((value) => value - 1);
  }

  function handleBookmarkToggle() {
    if (!currentVerse) {
      return;
    }

    toggleBookmark({
      verseKey: currentVerse.verseKey,
      chapterName,
      title: `${chapterName} ${currentVerse.verseNumber}`,
    });
  }

  function handleTafsirToggle() {
    setIsTafsirOpen((value) => !value);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navLeft}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          <Text style={styles.navTitle}>
            {chapterName} {startVerse}–{endVerse}
          </Text>
        </Pressable>
        <Text style={styles.navCounter}>
          {Math.min(currentIndex + 1, totalVerses || 1)} / {Math.max(totalVerses, 1)}
        </Text>
      </View>

      {state.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accentPrimary} />
          <Text style={styles.stateText}>Loading live verses and audio…</Text>
        </View>
      ) : state.error || !currentVerse ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>
            {state.error ?? "No verse content was returned."}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.readerContent}>
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>
                  Verse {currentVerse.verseKey}
                </Text>
              </View>

              <Text style={styles.arabic}>{currentVerse.arabicText}</Text>

              {showTranslation ? (
                <>
                  <View style={styles.goldDivider} />
                  <Text style={styles.translation}>
                    {currentVerse.translationText ||
                      "Translation is not available for this ayah on the public feed."}
                  </Text>
                  <Text style={styles.verseRef}>
                    — {chapterName} {currentVerse.verseNumber}
                  </Text>
                </>
              ) : (
                <Text style={styles.verseRef}>
                  — {chapterName} {currentVerse.verseNumber}
                </Text>
              )}

              <View style={styles.actions}>
                <Pressable style={styles.actionItem} onPress={handleBookmarkToggle}>
                  <Feather
                    name={currentVerseBookmarked ? "bookmark" : "bookmark"}
                    size={20}
                    color={
                      currentVerseBookmarked
                        ? colors.accentPrimary
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      currentVerseBookmarked && styles.actionLabelActive,
                    ]}
                  >
                    {currentVerseBookmarked ? "Saved" : "Save ayah"}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionItem} onPress={handleTafsirToggle}>
                  <Feather
                    name="book-open"
                    size={20}
                    color={isTafsirOpen ? colors.accentPrimary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      isTafsirOpen && styles.actionLabelActive,
                    ]}
                  >
                    {isTafsirOpen ? "Hide tafsir" : "Open tafsir"}
                  </Text>
                </Pressable>
              </View>

              {isTafsirOpen ? (
                <View style={styles.tafsirCard}>
                  <View style={styles.tafsirHeader}>
                    <Text style={styles.tafsirTitle}>Tafsir for {currentVerse.verseKey}</Text>
                    <Text style={styles.tafsirSource}>{tafsirSource}</Text>
                  </View>

                  {isTafsirLoading ? (
                    <View style={styles.tafsirLoading}>
                      <ActivityIndicator color={colors.accentPrimary} />
                      <Text style={styles.tafsirLoadingText}>Loading tafsir…</Text>
                    </View>
                  ) : tafsirError ? (
                    <Text style={styles.tafsirError}>{tafsirError}</Text>
                  ) : (
                    <>
                      <Text style={styles.tafsirText}>{tafsirText}</Text>
                      <Text style={styles.tafsirHint}>
                        This source is also used to build the reflection after the session.
                      </Text>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.audioSection}>
            <View style={styles.audioHeader}>
              <Text style={styles.reciterName}>
                {preferredReciter === 7 ? "Mishari al-`Afasy" : "Selected reciter"}
              </Text>
              <Text style={styles.audioDuration}>{audioError ?? "Ayah audio"}</Text>
            </View>
            <AudioPlayer
              audioUrl={currentAudioUrl}
              reciterName={
                preferredReciter === 7 ? "Mishari al-`Afasy" : "Selected reciter"
              }
            />
          </View>

          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavBtn} onPress={handlePrevious}>
              <Feather name="chevron-left" size={18} color={colors.textMuted} />
              <Text style={styles.bottomNavPrev}>
                {currentIndex === 0 ? "Back" : "Previous"}
              </Text>
            </Pressable>
            <Text style={styles.bottomNavCount}>
              Verse {currentVerse.verseNumber} of {endVerse}
            </Text>
            <Pressable style={styles.bottomNavBtn} onPress={handleNext}>
              <Text style={styles.bottomNavNext}>
                {currentIndex === totalVerses - 1 ? "Reflect" : "Next"}
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.accentPrimary}
              />
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 52,
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  navTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  navCounter: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  stateText: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  readerContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
    gap: 28,
  },
  verseBadge: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  verseBadgeText: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  arabic: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 58,
    textAlign: "center",
  },
  goldDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.accentPrimary,
    borderRadius: 1,
  },
  translation: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  verseRef: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 32,
    alignItems: "center",
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  actionLabelActive: { color: colors.accentPrimary },
  tafsirCard: {
    width: "100%",
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
  },
  tafsirHeader: {
    gap: 4,
  },
  tafsirTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  tafsirSource: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  tafsirLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tafsirLoadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  tafsirText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  tafsirHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  tafsirError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
  audioSection: {
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  audioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reciterName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  audioDuration: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },
  bottomNavBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomNavPrev: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  bottomNavCount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  bottomNavNext: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
