import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REMINDER_CHANNEL_ID = "daily-reminder";
const GRANTED_PERMISSION_STATUS = "granted";

function parseTime(value: string) {
  const [hh, mm] = value.split(":").map((part) => Number(part));
  const hour = Number.isFinite(hh) ? hh : 18;
  const minute = Number.isFinite(mm) ? mm : 30;

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute: Math.min(Math.max(minute, 0), 59),
  };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: "Daily Wird",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  const normalizedSettings = settings as Notifications.NotificationPermissionsStatus & {
    status?: string;
    granted?: boolean;
  };

  if (
    normalizedSettings.granted === true ||
    normalizedSettings.status === GRANTED_PERMISSION_STATUS ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
  ) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  const normalizedRequest = request as Notifications.NotificationPermissionsStatus & {
    status?: string;
    granted?: boolean;
  };

  return Boolean(
    normalizedRequest.granted === true ||
      normalizedRequest.status === GRANTED_PERMISSION_STATUS ||
      request.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED,
  );
}

// ---------------------------------------------------------------------------
// Notification copy — Wird's voice. Tone: Invitation (gentlest).
// This is the only uninvited message Wird sends. It must reinforce the
// "no guilt, no streak shaming" philosophy.
// ---------------------------------------------------------------------------
const DAILY_REMINDER_COPY = {
  title: "Your wird is waiting",
  body: "Whenever you're ready. No rush.",
};

export async function cancelDailyWirdReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyWirdReminder(notificationTime: string) {
  const allowed = await ensureNotificationPermissions();

  if (!allowed) {
    return null;
  }

  await ensureAndroidChannel();

  // Keep it simple: one scheduled reminder at a time.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { hour, minute } = parseTime(notificationTime);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: DAILY_REMINDER_COPY.title,
      body: DAILY_REMINDER_COPY.body,
      ...(Platform.OS === "ios" ? { sound: "default" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === "android" ? DAILY_REMINDER_CHANNEL_ID : undefined,
    } as Notifications.DailyTriggerInput,
  });
}
