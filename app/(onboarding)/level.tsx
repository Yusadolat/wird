import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useSettingsStore } from "../../store/settingsStore";

const levels = [
  {
    title: "Beginner",
    subtitle: "Show transliteration + translation",
    value: "beginner",
  },
  {
    title: "Intermediate",
    subtitle: "Arabic + translation only",
    value: "intermediate",
  },
  { title: "Advanced", subtitle: "Arabic only", value: "advanced" },
] as const;

export default function LevelScreen() {
  const [selected, setSelected] = useState(1);
  const router = useRouter();
  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );
  const setReadingLevel = useSettingsStore((state) => state.setReadingLevel);

  function handleStart() {
    setReadingLevel(levels[selected].value);
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.progressSection}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressSegment, styles.progressFilled]} />
            <View style={[styles.progressSegment, styles.progressFilled]} />
            <View style={[styles.progressSegment, styles.progressFilled]} />
          </View>
        </View>

        <Text style={styles.title}>
          How comfortable are you reading Arabic?
        </Text>

        <View style={styles.options}>
          {levels.map((level, index) => (
            <Pressable
              key={level.title}
              style={[styles.card, selected === index && styles.cardSelected]}
              onPress={() => setSelected(index)}
            >
              <View
                style={[
                  styles.radio,
                  selected === index && styles.radioSelected,
                ]}
              />
              <View style={styles.labelWrap}>
                <Text style={styles.cardTitle}>{level.title}</Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    selected === index && styles.cardSubtitleSelected,
                  ]}
                >
                  {level.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.buttons}>
          <Link href="/(onboarding)/schedule" asChild>
            <Pressable style={styles.backButton}>
              <Text style={styles.backButtonLabel}>Back</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonLabel}>Start!</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  progressSection: {
    gap: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  progressBar: {
    flexDirection: "row",
    height: 4,
    gap: 6,
    borderRadius: 2,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressFilled: {
    backgroundColor: colors.accentPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  options: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.accentPrimary,
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  labelWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  cardSubtitleSelected: {
    color: colors.accentPrimary,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 52,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  startButton: {
    flex: 1,
    height: 52,
    backgroundColor: colors.accentPrimary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textInverse,
  },
});
