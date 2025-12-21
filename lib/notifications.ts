// Notifications stub - notifications are not available in Expo Go
// This file provides no-op implementations so the app doesn't crash

// Request permission for notifications (no-op in Expo Go)
export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log('Notifications not available in Expo Go');
  return false;
};

// Check if notifications are enabled (always false in Expo Go)
export const areNotificationsEnabled = async (): Promise<boolean> => {
  return false;
};

// Schedule daily reminder (no-op)
export const scheduleDailyReminder = async (_time?: string): Promise<string | null> => {
  console.log('Daily reminder not available in Expo Go');
  return null;
};

// Cancel daily reminder (no-op)
export const cancelDailyReminder = async (): Promise<void> => {
  // No-op
};

// Schedule weekly planning reminder (no-op)
export const scheduleWeeklyPlanningReminder = async (): Promise<string | null> => {
  console.log('Weekly planning reminder not available in Expo Go');
  return null;
};

// Cancel weekly planning reminder (no-op)
export const cancelWeeklyPlanningReminder = async (): Promise<void> => {
  // No-op
};

// Schedule monthly planning reminder (no-op)
export const scheduleMonthlyPlanningReminder = async (): Promise<string | null> => {
  console.log('Monthly planning reminder not available in Expo Go');
  return null;
};

// Cancel monthly planning reminder (no-op)
export const cancelMonthlyPlanningReminder = async (): Promise<void> => {
  // No-op
};

// Cancel all scheduled notifications (no-op)
export const cancelAllNotifications = async (): Promise<void> => {
  // No-op
};

// Get all scheduled notifications (always empty in Expo Go)
export const getScheduledNotifications = async (): Promise<unknown[]> => {
  return [];
};

// Setup all notifications based on user preferences (no-op)
export const setupNotifications = async (_preferences: {
  daily_reminder: boolean;
  daily_reminder_time: string;
  weekly_planning_reminder: boolean;
  monthly_planning_reminder: boolean;
}): Promise<void> => {
  console.log('Notifications not available in Expo Go');
};

// Add notification response listener (no-op, returns dummy unsubscribe)
export const addNotificationResponseListener = (
  _callback: (response: unknown) => void
): { remove: () => void } => {
  return { remove: () => {} };
};

// Add notification received listener (no-op, returns dummy unsubscribe)
export const addNotificationReceivedListener = (
  _callback: (notification: unknown) => void
): { remove: () => void } => {
  return { remove: () => {} };
};
