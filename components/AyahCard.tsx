import { Pressable, StyleSheet, Text, View } from "react-native";

type AyahCardProps = {
  arabicText: string;
  translation: string;
  verseKey: string;
};

export function AyahCard({
  arabicText,
  translation,
  verseKey,
}: AyahCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.meta}>{verseKey}</Text>
      <Text style={styles.arabic}>{arabicText}</Text>
      <Text style={styles.translation}>{translation}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.button}>
          <Text style={styles.buttonLabel}>Bookmark</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text style={styles.buttonLabel}>Audio</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: "#101b2f",
    padding: 20,
    gap: 16,
  },
  meta: {
    color: "#94a3b8",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  arabic: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 46,
    textAlign: "right",
  },
  translation: {
    color: "#dbe4f0",
    fontSize: 15,
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#243147",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLabel: {
    color: "#dbe4f0",
    fontWeight: "600",
  },
});
