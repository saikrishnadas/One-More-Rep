import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

/** Schedule a daily habit reminder at the given HH:MM time */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  habitIcon: string,
  timeStr: string // 'HH:MM'
): Promise<void> {
  // Cancel any existing reminder for this habit
  await cancelHabitReminder(habitId);

  const [hour, minute] = timeStr.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `habit-${habitId}`,
    content: {
      title: `${habitIcon} Time for: ${habitName}`,
      body: "Don't break your streak! Check it off now. 🔥",
      sound: 'default',
      data: { habitId, type: 'habit_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/** Schedule a streak-at-risk alert at 9pm if habit not done */
export async function scheduleStreakAlert(habitId: string, habitName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `streak-${habitId}`,
    content: {
      title: '⚠️ Streak at Risk!',
      body: `Complete "${habitName}" before midnight to keep your streak alive!`,
      sound: 'default',
      data: { habitId, type: 'streak_alert' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 21,
      minute: 0,
      repeats: true,
    },
  });
}

/** Cancel all notifications for a habit */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(`streak-${habitId}`).catch(() => {});
}

/** Send an immediate local notification for badge unlock */
export async function notifyBadgeUnlocked(badgeName: string, badgeIcon: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${badgeIcon} Badge Unlocked!`,
      body: `You earned "${badgeName}". Keep it up! 💪`,
      sound: 'default',
      data: { type: 'badge_unlock' },
    },
    trigger: null, // immediate
  });
}

/** Send an immediate notification for level up */
export async function notifyLevelUp(newLevel: number, title: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚡ LEVEL UP! You're now Level ${newLevel}`,
      body: `Welcome to ${title}. Keep grinding! 🔥`,
      sound: 'default',
      data: { type: 'level_up', newLevel },
    },
    trigger: null,
  });
}

// Call this once at app start (in _layout.tsx)
export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('HABIT_REMINDER', [
    { identifier: 'DONE', buttonTitle: 'Done ✓', options: { opensAppToForeground: false } },
    { identifier: 'SKIP', buttonTitle: 'Skip', options: { opensAppToForeground: false } },
  ]);
}

// Schedule an interactive habit reminder with Done/Skip buttons
export async function scheduleHabitReminderInteractive(
  habitId: string,
  habitName: string,
  timeHHMM: string  // e.g. '07:30'
) {
  const [hour, minute] = timeHHMM.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Habit Check-in`,
      body: `Did you complete "${habitName}" today?`,
      categoryIdentifier: 'HABIT_REMINDER',
      data: { habitId, type: 'habit_checkin' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Schedule a rest-complete notification after the given number of seconds */
export async function scheduleRestNotification(seconds: number): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Rest Complete!',
      body: 'Time to lift — get back to work! 💪',
      sound: true,
    },
    trigger: { seconds, repeats: false } as any,
  });
}

/** Cancel a previously scheduled rest notification by ID */
export async function cancelRestNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

const WATER_REMINDER_IDS_KEY = 'water_reminder_ids';

/** Cancel all scheduled water reminder notifications */
export async function cancelWaterReminders(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(WATER_REMINDER_IDS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(
        ids.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
        )
      );
    }
    await AsyncStorage.removeItem(WATER_REMINDER_IDS_KEY);
  } catch {
    // ignore
  }
}

/** Schedule hourly water reminders from 9am to 9pm */
export async function scheduleWaterReminders(): Promise<void> {
  await cancelWaterReminders();

  const ids: string[] = [];

  for (let hour = 9; hour <= 21; hour++) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Stay Hydrated',
        body: 'Time to drink some water!',
        sound: 'default',
        data: { type: 'water_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
      },
    });
    ids.push(id);
  }

  await AsyncStorage.setItem(WATER_REMINDER_IDS_KEY, JSON.stringify(ids));
}
