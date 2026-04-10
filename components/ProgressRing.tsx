import { StyleSheet, Text, View } from "react-native";

type ProgressRingProps = {
  percentage: number;
  caption: string;
};

export function ProgressRing({ percentage, caption }: ProgressRingProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Text style={styles.value}>{percentage}%</Text>
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 12,
  },
  ring: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 10,
    borderColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  value: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
  },
  caption: {
    color: "#94a3b8",
    fontSize: 14,
  },
});
