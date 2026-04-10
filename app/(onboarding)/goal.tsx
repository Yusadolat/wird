import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { GOAL_OPTIONS } from "../../services/wirdEngine";
import { useWirdStore } from "../../store/wirdStore";

export default function GoalScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(1);
  const configureGoal = useWirdStore((state) => state.configureGoal);

  function handleNext() {
    const goal = GOAL_OPTIONS[selected];
    configureGoal(goal.goalType, goal.targetDays);
    router.push("/(onboarding)/schedule");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.progressSection}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressSegment, styles.progressFilled]} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
          </View>
        </View>

        <Text style={styles.title}>What&apos;s your goal?</Text>

        <View style={styles.options}>
          {GOAL_OPTIONS.map((goal, index) => (
            <Pressable
              key={goal.title}
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
                <Text style={styles.cardTitle}>{goal.title}</Text>
                {goal.subtitle && (
                  <Text
                    style={[
                      styles.cardSubtitle,
                      selected === index && styles.cardSubtitleSelected,
                    ]}
                  >
                    {goal.subtitle}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonLabel}>Next</Text>
        </Pressable>
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
    padding: 16,
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
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardSubtitleSelected: {
    color: colors.accentPrimary,
  },
  nextButton: {
    height: 52,
    backgroundColor: colors.accentPrimary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textInverse,
  },
});
