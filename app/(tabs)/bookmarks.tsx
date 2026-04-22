import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../../constants/theme";
import { useAppDataStore } from "../../store/appDataStore";

export default function BookmarksScreen() {
  const bookmarks = useAppDataStore((store) => store.bookmarks);
  const removeBookmark = useAppDataStore((store) => store.removeBookmark);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Saved Ayat</Text>
          <Text style={styles.count}>{bookmarks.length} bookmarks</Text>
        </View>

        <Link href="/connected-library" asChild>
          <Pressable style={styles.connectedCard}>
            <View style={styles.connectedIcon}>
              <Feather name="cloud" size={18} color={colors.accentPrimary} />
            </View>
            <View style={styles.connectedCopy}>
              <Text style={styles.connectedTitle}>Connected Library</Text>
              <Text style={styles.connectedText}>
                Import Quran.com bookmarks and check User API sync status.
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={colors.accentPrimary} />
          </Pressable>
        </Link>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="bookmark" size={24} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No ayat saved yet</Text>
            <Text style={styles.emptyText}>
              Save an ayah from the home or reader screen and it will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {bookmarks.map((bookmark, index) => (
              <View
                key={bookmark.id}
                style={[
                  styles.row,
                  index === bookmarks.length - 1 && styles.rowLast,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Feather
                    name="bookmark"
                    size={16}
                    color={colors.accentPrimary}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowKey}>{bookmark.verseKey}</Text>
                  <Text style={styles.rowTitle}>{bookmark.title}</Text>
                  <Text style={styles.rowSurah}>{bookmark.chapterName}</Text>
                </View>
                <Pressable
                  onPress={() => removeBookmark(bookmark.verseKey)}
                  style={styles.removeButton}
                >
                  <Feather name="x" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 20, paddingTop: 24, paddingBottom: 24, gap: 24 },
  header: { gap: 4 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  count: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  connectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  connectedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectedCopy: { flex: 1, gap: 4 },
  connectedTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  connectedText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  list: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200, 169, 110, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowKey: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "500" },
  rowSurah: { color: colors.textMuted, fontSize: 12 },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSecondary,
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 28,
    gap: 12,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
