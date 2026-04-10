import { StyleSheet, Text, View } from "react-native";

type StreakCalendarProps = {
  days: Array<"done" | "empty">;
};

export function StreakCalendar({ days }: StreakCalendarProps) {
  return (
    <View style={styles.wrap}>
      {days.map((day, index) => (
        <View
          key={`${day}-${index}`}
          style={[styles.dot, day === "done" ? styles.done : styles.empty]}
        />
      ))}
      <Text style={styles.caption}>This week</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  done: {
    backgroundColor: "#22c55e",
  },
  empty: {
    backgroundColor: "#1e293b",
  },
  caption: {
    color: "#94a3b8",
    marginLeft: 6,
  },
});
