import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReminderTimePicker } from "../../components/ReminderTimePicker";
import { colors } from "../../constants/theme";
import { useSettingsStore } from "../../store/settingsStore";

export default function ScheduleScreen() {
  const router = useRouter();
  const currentNotificationTime = useSettingsStore(
    (state) => state.notificationTime,
  );
  const [selectedTime, setSelectedTime] = useState(currentNotificationTime);
  const setNotificationTime = useSettingsStore(
    (state) => state.setNotificationTime,
  );

  function handleNext() {
    setNotificationTime(selectedTime);
    router.push("/(onboarding)/level");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.progressSection}>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressSegment, styles.progressFilled]} />
            <View style={[styles.progressSegment, styles.progressFilled]} />
            <View style={styles.progressSegment} />
          </View>
        </View>

        <Text style={styles.title}>When do you prefer to read?</Text>
        <Text style={styles.subtitle}>
          Pick the exact time your daily reminder should arrive.
        </Text>

        <ReminderTimePicker value={selectedTime} onChange={setSelectedTime} />

        <View style={{ flex: 1 }} />

        <View style={styles.buttons}>
          <Link href="/(onboarding)/goal" asChild>
            <Pressable style={styles.backButton}>
              <Text style={styles.backButtonLabel}>Back</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonLabel}>Next</Text>
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -12,
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
  nextButton: {
    flex: 1,
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
