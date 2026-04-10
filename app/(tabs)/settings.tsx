import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radii } from "../../constants/theme";
import { config } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useSettingsStore } from "../../store/settingsStore";
import type { ReadingLevel } from "../../types/wird";

const RECITERS = [
  { id: 7, label: "Mishari al-`Afasy", subtitle: "Balanced, familiar default" },
  { id: 3, label: "Abdur-Rahman as-Sudais", subtitle: "Makkah-style recitation" },
  { id: 4, label: "Abu Bakr al-Shatri", subtitle: "Measured, steady pace" },
];

const READING_LEVEL_OPTIONS: {
  value: ReadingLevel;
  label: string;
  subtitle: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    subtitle: "Arabic with extra support",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    subtitle: "Arabic and translation",
  },
  {
    value: "advanced",
    label: "Advanced",
    subtitle: "Arabic-focused reading",
  },
];

const REMINDER_TIMES = [
  { value: "05:45", label: "After Fajr" },
  { value: "15:45", label: "After Asr" },
  { value: "18:30", label: "After Maghrib" },
  { value: "20:15", label: "After Isha" },
];

type SelectorOptionProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  isSelected: boolean;
  onPress: () => void;
};

function SelectorOption({
  icon,
  label,
  subtitle,
  isSelected,
  onPress,
}: SelectorOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
    >
      <View style={styles.optionHeader}>
        <View style={styles.optionIconWrap}>
          <Feather
            name={icon}
            size={16}
            color={isSelected ? colors.textInverse : colors.accentPrimary}
          />
        </View>
        <View style={styles.optionCopy}>
          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
            {label}
          </Text>
          <Text
            style={[
              styles.optionSubtitle,
              isSelected && styles.optionSubtitleSelected,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      {isSelected ? (
        <View style={styles.selectedBadge}>
          <Feather name="check" size={14} color={colors.textInverse} />
          <Text style={styles.selectedBadgeText}>Selected</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Feather name={icon} size={16} color={colors.accentPrimary} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const displayName = useAuthStore((state) => state.displayName);
  const email = useAuthStore((state) => state.email);
  const isGuest = useAuthStore((state) => state.isGuest);
  const notificationTime = useSettingsStore((state) => state.notificationTime);
  const preferredReciter = useSettingsStore((state) => state.preferredReciter);
  const readingLevel = useSettingsStore((state) => state.readingLevel);
  const hasLoadedRemote = useSettingsStore((state) => state.hasLoadedRemote);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const setNotificationTime = useSettingsStore(
    (state) => state.setNotificationTime,
  );
  const setPreferredReciter = useSettingsStore(
    (state) => state.setPreferredReciter,
  );
  const setReadingLevel = useSettingsStore((state) => state.setReadingLevel);

  const syncConfigured = Boolean(
    config.enableSupabaseSync && config.supabaseUrl && config.supabaseAnonKey,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.heroSubtitle}>
            Tune how Wird sounds, reads, and syncs your progress across your
            personal Quran routine.
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon="headphones"
            title="Reciter"
            subtitle="Choose the voice used for your reading sessions."
          />
          {RECITERS.map((reciter) => (
            <SelectorOption
              key={reciter.id}
              icon="volume-2"
              label={reciter.label}
              subtitle={reciter.subtitle}
              isSelected={preferredReciter === reciter.id}
              onPress={() => setPreferredReciter(reciter.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon="type"
            title="Reading Mode"
            subtitle="Match the verse display to your comfort level."
          />
          {READING_LEVEL_OPTIONS.map((option) => (
            <SelectorOption
              key={option.value}
              icon="book-open"
              label={option.label}
              subtitle={option.subtitle}
              isSelected={readingLevel === option.value}
              onPress={() => setReadingLevel(option.value)}
            />
          ))}
          <View style={styles.infoCard}>
            <Feather name="info" size={16} color={colors.accentPrimary} />
            <Text style={styles.infoText}>
              Translation is currently driven by the public Quran content APIs.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon="clock"
            title="Reminder Time"
            subtitle="Set the reading window you want the app to optimize for."
          />
          <View style={styles.timeGrid}>
            {REMINDER_TIMES.map((slot) => {
              const selected = notificationTime === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => setNotificationTime(slot.value)}
                  style={[styles.timeChip, selected && styles.timeChipSelected]}
                >
                  <Text
                    style={[
                      styles.timeChipLabel,
                      selected && styles.timeChipLabelSelected,
                    ]}
                  >
                    {slot.label}
                  </Text>
                  <Text
                    style={[
                      styles.timeChipValue,
                      selected && styles.timeChipValueSelected,
                    ]}
                  >
                    {slot.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon="database"
            title="Account"
            subtitle="Update your preferences or restart onboarding any time."
          />
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Quran.com session</Text>
              <Text style={styles.statusValue}>
                {isGuest ? "Guest mode" : displayName ?? email ?? "Connected"}
              </Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Storage mode</Text>
              <Text style={styles.statusValue}>
                {syncConfigured ? "Local + Supabase" : "Local only"}
              </Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Remote hydration</Text>
              <Text style={styles.statusValue}>
                {hasLoadedRemote ? "Checked on launch" : "Pending launch check"}
              </Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Project connection</Text>
              <Text style={styles.statusValue}>
                {syncConfigured ? "Keys detected" : "Waiting for keys"}
              </Text>
            </View>
          </View>

          <View style={styles.accountActions}>
            {!isGuest ? (
              <Pressable
                style={styles.signOutButton}
                onPress={() => {
                  void clearSession().then(() => {
                    router.replace("/(auth)/login");
                  });
                }}
              >
                <Feather name="log-out" size={16} color={colors.textInverse} />
                <Text style={styles.signOutButtonText}>Sign out</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.reconnectButton}
                onPress={() => {
                  router.replace("/(auth)/login");
                }}
              >
                <Feather name="log-in" size={16} color={colors.accentPrimary} />
                <Text style={styles.reconnectButtonText}>
                  Sign in with Quran.com
                </Text>
              </Pressable>
            )}

            {!isGuest ? (
              <Text style={styles.accountHint}>
                Use sign out if you need to reconnect or switch accounts.
              </Text>
            ) : (
              <Text style={styles.accountHint}>
                Guest mode keeps local progress on this device until you sign in.
              </Text>
            )}
          </View>

          <View style={styles.restartCard}>
            <View style={styles.restartCopy}>
              <Text style={styles.restartTitle}>Want to change your plan?</Text>
              <Text style={styles.restartSubtitle}>
                Restart onboarding to pick a new goal, reminder time, and reading mode.
              </Text>
            </View>
            <Pressable
              style={styles.restartButton}
              onPress={() => {
                resetOnboarding();
                router.replace("/(onboarding)/goal");
              }}
            >
              <Feather name="rotate-ccw" size={16} color={colors.textInverse} />
              <Text style={styles.restartButtonText}>Restart onboarding</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.version}>Wird v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 20, paddingTop: 24, paddingBottom: 32, gap: 28 },
  hero: { gap: 8 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: { flex: 1, gap: 4 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  optionCardSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  optionTitleSelected: {
    color: colors.textInverse,
  },
  optionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  optionSubtitleSelected: {
    color: "rgba(13,27,42,0.8)",
  },
  selectedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    backgroundColor: "rgba(13,27,42,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.bgSecondary,
    padding: 14,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timeChip: {
    width: "47%",
    minWidth: 145,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  timeChipSelected: {
    backgroundColor: colors.accentSecondary,
    borderColor: colors.accentSecondary,
  },
  timeChipLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  timeChipLabelSelected: {
    color: colors.textPrimary,
  },
  timeChipValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  timeChipValueSelected: {
    color: colors.textPrimary,
  },
  statusCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  statusDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 18,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  statusValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
  signOutButton: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 12,
  },
  signOutButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: "800",
  },
  accountActions: {
    gap: 8,
  },
  reconnectButton: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    backgroundColor: colors.bgCard,
    paddingVertical: 12,
  },
  reconnectButtonText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  accountHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  restartCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    padding: 16,
    gap: 14,
  },
  restartCopy: {
    gap: 6,
  },
  restartTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  restartSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 12,
  },
  restartButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: "800",
  },
  version: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
