import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function scheduleDailyWirdNotification(input: {
  title: string;
  body: string;
  hour: number;
  minute: number;
  data?: Record<string, unknown>;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: input.data,
      ...(Platform.OS === "ios" ? { sound: "default" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: input.hour,
      minute: input.minute,
    },
  });
}
