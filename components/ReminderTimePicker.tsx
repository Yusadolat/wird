import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii } from "../constants/theme";

type ReminderTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function parseTime(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  ) {
    return { hour, minute };
  }

  return { hour: 18, minute: 30 };
}

function formatTime(hour: number, minute: number) {
  return `${String((hour + 24) % 24).padStart(2, "0")}:${String(
    (minute + 60) % 60,
  ).padStart(2, "0")}`;
}

function formatDisplayTime(value: string) {
  const { hour, minute } = parseTime(value);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function updateTime(value: string, hourDelta: number, minuteDelta: number) {
  const { hour, minute } = parseTime(value);
  const totalMinutes = hour * 60 + minute + hourDelta * 60 + minuteDelta;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;

  return formatTime(Math.floor(normalized / 60), normalized % 60);
}

function setMinute(value: string, minute: number) {
  const { hour } = parseTime(value);

  return formatTime(hour, minute);
}

function TimeStepper({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepButton} onPress={onIncrement}>
        <Feather name="chevron-up" size={22} color={colors.accentPrimary} />
      </Pressable>
      <View style={styles.stepValueWrap}>
        <Text style={styles.stepValue}>{value}</Text>
        <Text style={styles.stepLabel}>{label}</Text>
      </View>
      <Pressable style={styles.stepButton} onPress={onDecrement}>
        <Feather name="chevron-down" size={22} color={colors.accentPrimary} />
      </Pressable>
    </View>
  );
}

export function ReminderTimePicker({ value, onChange }: ReminderTimePickerProps) {
  const { hour, minute } = parseTime(value);
  const minuteOptions = [0, 15, 30, 45];
  const hourDegrees = ((hour % 12) + minute / 60) * 30;
  const minuteDegrees = minute * 6;

  return (
    <View style={styles.card}>
      <View style={styles.clockFace}>
        <View style={styles.clockRing}>
          <View
            style={[
              styles.clockHand,
              styles.clockHandHour,
              { transform: [{ rotate: `${hourDegrees}deg` }] },
            ]}
          >
            <View style={styles.clockHandHourLine} />
          </View>
          <View
            style={[
              styles.clockHand,
              styles.clockHandMinute,
              { transform: [{ rotate: `${minuteDegrees}deg` }] },
            ]}
          >
            <View style={styles.clockHandMinuteLine} />
          </View>
          <View style={styles.clockCenter} />
        </View>
        <View style={styles.clockCopy}>
          <Text style={styles.clockLabel}>Reminder time</Text>
          <Text style={styles.clockTime}>{formatDisplayTime(value)}</Text>
          <Text style={styles.clockSubtime}>{formatTime(hour, minute)}</Text>
        </View>
      </View>

      <View style={styles.stepperRow}>
        <TimeStepper
          label="Hour"
          value={String(hour).padStart(2, "0")}
          onIncrement={() => onChange(updateTime(value, 1, 0))}
          onDecrement={() => onChange(updateTime(value, -1, 0))}
        />
        <TimeStepper
          label="Minute"
          value={String(minute).padStart(2, "0")}
          onIncrement={() => onChange(updateTime(value, 0, 5))}
          onDecrement={() => onChange(updateTime(value, 0, -5))}
        />
      </View>

      <View style={styles.minuteRow}>
        {minuteOptions.map((option) => {
          const selected = minute === option;

          return (
            <Pressable
              key={option}
              style={[styles.minuteChip, selected && styles.minuteChipSelected]}
              onPress={() => onChange(setMinute(value, option))}
            >
              <Text
                style={[
                  styles.minuteChipText,
                  selected && styles.minuteChipTextSelected,
                ]}
              >
                :{String(option).padStart(2, "0")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 18,
  },
  clockFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clockRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: colors.accentPrimary,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  clockHand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  clockHandMinute: {
    zIndex: 1,
  },
  clockHandHour: {
    zIndex: 2,
  },
  clockHandHourLine: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: colors.accentPrimary,
    transform: [{ translateY: -12 }],
  },
  clockHandMinuteLine: {
    width: 3,
    height: 34,
    borderRadius: 2,
    backgroundColor: colors.accentSecondary,
    transform: [{ translateY: -17 }],
  },
  clockCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
    zIndex: 3,
  },
  clockCopy: { flex: 1, gap: 3 },
  clockLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  clockTime: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  clockSubtime: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  stepperRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepper: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    paddingVertical: 10,
  },
  stepButton: {
    width: 44,
    height: 34,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValueWrap: {
    alignItems: "center",
    gap: 2,
  },
  stepValue: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  minuteRow: {
    flexDirection: "row",
    gap: 8,
  },
  minuteChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  minuteChipSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  minuteChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  minuteChipTextSelected: {
    color: colors.textInverse,
  },
});
