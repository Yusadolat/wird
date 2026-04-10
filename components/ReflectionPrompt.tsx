import { StyleSheet, Text, View } from "react-native";

type ReflectionPromptProps = {
  prompt: string;
};

export function ReflectionPrompt({ prompt }: ReflectionPromptProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Reflect</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: "#101b2f",
    padding: 20,
    gap: 12,
  },
  label: {
    color: "#7dd3fc",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  prompt: {
    color: "#f8fafc",
    fontSize: 16,
    lineHeight: 26,
  },
});
