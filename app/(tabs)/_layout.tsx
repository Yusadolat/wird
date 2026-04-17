import { Feather } from "@expo/vector-icons";
import { type BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: "home",
  progress: "trending-up",
  bookmarks: "bookmark",
  settings: "settings",
};

const TAB_LABELS: Record<string, string> = {
  index: "HOME",
  progress: "PROGRESS",
  bookmarks: "SAVED",
  settings: "SETTINGS",
};

function PillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // On Android 3-button nav, insets.bottom is typically 0 but the system nav still
  // sits beneath us; use a minimum floor so the pill clears either style of nav.
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.tabContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? "circle";
          const label = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Feather
                name={iconName}
                size={18}
                color={isFocused ? colors.textInverse : colors.tabInactive}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.textInverse : colors.tabInactive },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="bookmarks" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    paddingTop: 12,
    paddingHorizontal: 21,
    backgroundColor: colors.bgPrimary,
  },
  pill: {
    flexDirection: "row",
    height: 68,
    backgroundColor: colors.bgSecondary,
    borderRadius: 36,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  tabActive: {
    backgroundColor: colors.accentPrimary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
