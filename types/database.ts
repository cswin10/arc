// Database types matching Supabase schema

export type HabitType = 'daily' | 'weekly';

export interface User {
  id: string;
  email: string;
  created_at: string;
  settings: UserSettings;
}

export interface UserSettings {
  dark_mode?: boolean;
  notification_preferences?: {
    daily_reminder: boolean;
    daily_reminder_time: string; // HH:MM format
    weekly_planning_reminder: boolean;
    monthly_planning_reminder: boolean;
  };
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  created_at: string;
  start_date: string;
  is_archived: boolean;
  order: number;
  linked_yearly_goal_id: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

export interface WeeklyTarget {
  id: string;
  habit_id: string;
  user_id: string;
  week_start: string;
  target: number;
  created_at: string;
}

export interface StreakFreeze {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  name: string;
  date: string;
  completed: boolean;
  order: number;
  created_at: string;
}

export interface WeeklyGoal {
  id: string;
  user_id: string;
  name: string;
  week_start: string;
  target: number;
  current: number;
  is_recurring: boolean;
  is_archived: boolean;
  linked_yearly_goal_id: string | null;
  created_at: string;
}

export interface MonthlyGoal {
  id: string;
  user_id: string;
  name: string;
  month: string;
  target: number;
  current: number;
  is_recurring: boolean;
  is_archived: boolean;
  linked_yearly_goal_id: string | null;
  created_at: string;
}

export type YearlyGoalCategory =
  | 'business'
  | 'brand'
  | 'health'
  | 'personal'
  | 'travel'
  | 'lifestyle'
  | 'other';

export interface YearlyGoal {
  id: string;
  user_id: string;
  name: string;
  year: number;
  target: number;
  current: number;
  category: YearlyGoalCategory;
  is_archived: boolean;
  created_at: string;
}

// Extended types with computed fields
export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  todayLog?: HabitLog;
}

export interface WeeklyHabitWithProgress extends Habit {
  weeklyTarget?: WeeklyTarget;
  currentProgress: number;
  logs: HabitLog[];
}

// Database table types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      habits: {
        Row: Habit;
        Insert: Omit<Habit, 'id' | 'created_at'>;
        Update: Partial<Omit<Habit, 'id' | 'user_id'>>;
      };
      habit_logs: {
        Row: HabitLog;
        Insert: Omit<HabitLog, 'id' | 'created_at'>;
        Update: Partial<Omit<HabitLog, 'id' | 'user_id'>>;
      };
      weekly_targets: {
        Row: WeeklyTarget;
        Insert: Omit<WeeklyTarget, 'id' | 'created_at'>;
        Update: Partial<Omit<WeeklyTarget, 'id' | 'user_id'>>;
      };
      streak_freezes: {
        Row: StreakFreeze;
        Insert: Omit<StreakFreeze, 'id' | 'created_at'>;
        Update: Partial<Omit<StreakFreeze, 'id' | 'user_id'>>;
      };
      daily_tasks: {
        Row: DailyTask;
        Insert: Omit<DailyTask, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyTask, 'id' | 'user_id'>>;
      };
      weekly_goals: {
        Row: WeeklyGoal;
        Insert: Omit<WeeklyGoal, 'id' | 'created_at'>;
        Update: Partial<Omit<WeeklyGoal, 'id' | 'user_id'>>;
      };
      monthly_goals: {
        Row: MonthlyGoal;
        Insert: Omit<MonthlyGoal, 'id' | 'created_at'>;
        Update: Partial<Omit<MonthlyGoal, 'id' | 'user_id'>>;
      };
      yearly_goals: {
        Row: YearlyGoal;
        Insert: Omit<YearlyGoal, 'id' | 'created_at'>;
        Update: Partial<Omit<YearlyGoal, 'id' | 'user_id'>>;
      };
    };
  };
}
