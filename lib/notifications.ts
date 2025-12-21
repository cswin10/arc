import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Config } from '../constants/config';
import { parseTimeString, isSunday, isLastDayOfMonth, getToday } from './utils';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permission for notifications
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  return true;
};

// Check if notifications are enabled
export const areNotificationsEnabled = async (): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// Schedule daily reminder
export const scheduleDailyReminder = async (time: string = Config.DEFAULT_REMINDER_TIME): Promise<string | null> => {
  try {
    // Cancel existing daily reminders first
    await cancelDailyReminder();

    const { hour, minute } = parseTimeString(time);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: Config.NOTIFICATIONS.DAILY_REMINDER_TITLE,
        body: Config.NOTIFICATIONS.DAILY_REMINDER_BODY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

// Cancel daily reminder
export const cancelDailyReminder = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.title === Config.NOTIFICATIONS.DAILY_REMINDER_TITLE) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Schedule weekly planning reminder (Sundays)
export const scheduleWeeklyPlanningReminder = async (): Promise<string | null> => {
  try {
    await cancelWeeklyPlanningReminder();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: Config.NOTIFICATIONS.WEEKLY_PLANNING_TITLE,
        body: Config.NOTIFICATIONS.WEEKLY_PLANNING_BODY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday is 1 in Expo Notifications
        hour: 9,
        minute: 0,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling weekly planning reminder:', error);
    return null;
  }
};

// Cancel weekly planning reminder
export const cancelWeeklyPlanningReminder = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.title === Config.NOTIFICATIONS.WEEKLY_PLANNING_TITLE) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Schedule monthly planning reminder
// Note: This schedules for the next month end - needs to be rescheduled each month
export const scheduleMonthlyPlanningReminder = async (): Promise<string | null> => {
  try {
    await cancelMonthlyPlanningReminder();

    // Calculate next month's last day
    const today = getToday();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);

    // Set time to 9 AM
    lastDayOfNextMonth.setHours(9, 0, 0, 0);

    // Only schedule if it's in the future
    if (lastDayOfNextMonth <= today) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: Config.NOTIFICATIONS.MONTHLY_PLANNING_TITLE,
        body: Config.NOTIFICATIONS.MONTHLY_PLANNING_BODY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: lastDayOfNextMonth,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling monthly planning reminder:', error);
    return null;
  }
};

// Cancel monthly planning reminder
export const cancelMonthlyPlanningReminder = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.title === Config.NOTIFICATIONS.MONTHLY_PLANNING_TITLE) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get all scheduled notifications
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return Notifications.getAllScheduledNotificationsAsync();
};

// Setup all notifications based on user preferences
export const setupNotifications = async (preferences: {
  daily_reminder: boolean;
  daily_reminder_time: string;
  weekly_planning_reminder: boolean;
  monthly_planning_reminder: boolean;
}): Promise<void> => {
  const hasPermission = await requestNotificationPermissions();

  if (!hasPermission) {
    return;
  }

  if (preferences.daily_reminder) {
    await scheduleDailyReminder(preferences.daily_reminder_time);
  } else {
    await cancelDailyReminder();
  }

  if (preferences.weekly_planning_reminder) {
    await scheduleWeeklyPlanningReminder();
  } else {
    await cancelWeeklyPlanningReminder();
  }

  if (preferences.monthly_planning_reminder) {
    await scheduleMonthlyPlanningReminder();
  } else {
    await cancelMonthlyPlanningReminder();
  }
};

// Add notification response listener
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Add notification received listener
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationReceivedListener(callback);
};
