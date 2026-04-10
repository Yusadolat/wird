import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useSettingsStore } from "../../store/settingsStore";

const schedules = [
  { label: "After Fajr", value: "05:45" },
  { label: "After Asr", value: "15:45" },
  { label: "After Maghrib", value: "18:30" },
  { label: "After Isha", value: "20:15" },
  { label: "Custom time...", value: "custom" },
];

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(1);
  const currentNotificationTime = useSettingsStore(
    (state) => state.notificationTime,
  );
  const [customTime, setCustomTime] = useState(currentNotificationTime);
  const [error, setError] = useState<string | null>(null);
  const setNotificationTime = useSettingsStore(
    (state) => state.setNotificationTime,
  );
  const isCustomSelected = schedules[selected]?.value === "custom";
  const resolvedTime = useMemo(() => {
    if (!isCustomSelected) {
      return schedules[selected].value;
    }

    return customTime;
  }, [customTime, isCustomSelected, selected]);

  function handleNext() {
    if (!isValidTime(resolvedTime)) {
      setError("Enter a valid time in 24-hour format, for example 18:30.");
      return;
    }

    setError(null);
    setNotificationTime(resolvedTime);
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

        <View style={styles.options}>
          {schedules.map((slot, index) => (
            <Pressable
              key={slot.label}
              style={[styles.card, selected === index && styles.cardSelected]}
              onPress={() => {
                setError(null);
                setSelected(index);
              }}
            >
              <View
                style={[
                  styles.radio,
                  selected === index && styles.radioSelected,
                ]}
              />
              <Text style={styles.cardTitle}>{slot.label}</Text>
            </Pressable>
          ))}
        </View>

        {isCustomSelected ? (
          <View style={styles.customTimeWrap}>
            <Text style={styles.customTimeLabel}>Enter custom time</Text>
            <TextInput
              value={customTime}
              onChangeText={(value) => {
                setError(null);
                setCustomTime(normalizeTimeInput(value));
              }}
              placeholder="18:30"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.customTimeInput}
            />
            <Text style={styles.customTimeHint}>
              Use 24-hour time, for example 05:45 or 20:15.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        ) : null}

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
  options: {
    gap: 12,
  },
  customTimeWrap: {
    gap: 8,
    marginTop: -8,
  },
  customTimeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  customTimeInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  customTimeHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "500",
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
  cardTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
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
