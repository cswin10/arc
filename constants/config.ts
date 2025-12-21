// App configuration constants

export const Config = {
  // App info
  APP_NAME: 'Arc',
  APP_VERSION: '1.0.0',

  // Supabase - Replace with your actual values
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',

  // Date/Time
  WEEK_START_DAY: 0, // 0 = Sunday
  DEFAULT_REMINDER_TIME: '09:00',

  // Notifications
  NOTIFICATIONS: {
    DAILY_REMINDER_TITLE: "Don't forget your habits!",
    DAILY_REMINDER_BODY: "Don't forget to log your habits today!",
    WEEKLY_PLANNING_TITLE: 'Time to plan your week!',
    WEEKLY_PLANNING_BODY: 'Set your targets for the week ahead.',
    MONTHLY_PLANNING_TITLE: "Month's almost over!",
    MONTHLY_PLANNING_BODY: 'Plan your goals for next month.',
  },

  // UI
  SWIPE_THRESHOLD: 80, // px to trigger swipe action
  ANIMATION_DURATION: 200, // ms

  // Limits
  MAX_HABIT_NAME_LENGTH: 100,
  MAX_GOAL_NAME_LENGTH: 100,
  MAX_TASK_NAME_LENGTH: 200,
} as const;
