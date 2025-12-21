# Arc - Habit & Goal Tracking App

A production-ready mobile app for tracking daily habits, weekly goals, monthly goals, and yearly goals. Built with Expo (React Native) and Supabase.

## Features

- **Daily Habits**: Track daily habits with swipe gestures (swipe right = done, swipe left = skip)
- **Weekly Habits**: Set weekly targets and track progress throughout the week
- **Daily Tasks**: One-off tasks that can be added and completed each day
- **Weekly Goals**: Set and track goals for each week
- **Monthly Goals**: Set bigger goals to achieve by month's end
- **Yearly Goals**: Set ambitious annual goals and link smaller goals to them
- **Streak Tracking**: Automatic streak calculation with support for streak freezes
- **Notifications**: Daily reminders, weekly planning prompts, monthly planning prompts
- **Dark Mode**: Full dark mode support with system theme detection
- **Statistics**: View completion rates, streaks, and progress over time

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (Auth, Database, Realtime)
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Notifications**: Expo Notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arc
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file located at `supabase/migrations/001_initial_schema.sql`

This will create all necessary tables, indexes, RLS policies, and triggers.

### Running the App

Start the development server:
```bash
npm start
```

Then:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on your physical device

## Project Structure

```
/app                    # Expo Router screens
  /(auth)              # Authentication screens
  /(tabs)              # Main tab screens (Today, Weekly, Monthly, Yearly, Settings)
  /habit/[id].tsx      # Habit detail screen
  /goal/[id].tsx       # Goal detail screen
  /stats.tsx           # Statistics screen
  /plan-week.tsx       # Weekly planning screen
  /plan-month.tsx      # Monthly planning screen

/components            # Reusable UI components
  SwipeableHabit.tsx   # Swipeable habit card
  TaskItem.tsx         # Daily task item
  GoalCard.tsx         # Goal card with progress
  ProgressBar.tsx      # Progress bar component
  AddHabitModal.tsx    # Modal for adding habits
  AddGoalModal.tsx     # Modal for adding goals
  ...

/lib                   # Utility libraries
  supabase.ts          # Supabase client
  auth.ts              # Authentication helpers
  database.ts          # Database queries
  utils.ts             # Date helpers, streak calculation
  notifications.ts     # Notification helpers

/hooks                 # Custom React hooks
  useAuth.ts           # Authentication hook
  useHabits.ts         # Habits hook
  useGoals.ts          # Goals hook
  useTheme.ts          # Theme hook

/stores                # Zustand stores
  authStore.ts         # Authentication state
  habitStore.ts        # Habits state
  goalStore.ts         # Goals state
  uiStore.ts           # UI state (theme)

/types                 # TypeScript types
  database.ts          # Database types

/constants             # App constants
  colors.ts            # Color palette
  config.ts            # App configuration

/supabase              # Database migrations
  migrations/          # SQL migration files
```

## Key Features Explained

### Habit Tracking
- **Daily Habits**: Swipe right to mark as done, swipe left to skip
- **Weekly Habits**: Set a weekly target (e.g., "Exercise 4 times this week")
- **Streaks**: Automatic calculation of consecutive completed days
- **Streak Freezes**: Protect your streak on rest days

### Goal Linking
- Link weekly and monthly goals to yearly goals
- Track progress contribution from smaller goals to bigger goals
- View all linked items from the yearly goal detail screen

### Planning
- Weekly planning prompts on Sundays
- Monthly planning prompts on the last day of the month
- Set targets for weekly habits
- Create one-off goals for specific periods

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
