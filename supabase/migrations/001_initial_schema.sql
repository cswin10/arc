-- Arc Habit Tracking App - Initial Schema
-- This migration creates all tables and sets up Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABLES ====================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- Yearly goals table (created first to allow foreign key references)
CREATE TABLE IF NOT EXISTS public.yearly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    target INTEGER NOT NULL CHECK (target >= 0),
    current INTEGER DEFAULT 0 NOT NULL CHECK (current >= 0),
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    "order" INTEGER DEFAULT 0 NOT NULL,
    linked_yearly_goal_id UUID REFERENCES public.yearly_goals(id) ON DELETE SET NULL
);

-- Habit logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(habit_id, date)
);

-- Weekly targets table
CREATE TABLE IF NOT EXISTS public.weekly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    target INTEGER NOT NULL CHECK (target >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(habit_id, week_start)
);

-- Streak freezes table
CREATE TABLE IF NOT EXISTS public.streak_freezes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(habit_id, date)
);

-- Daily tasks table
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    "order" INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS public.weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_start DATE NOT NULL,
    target INTEGER NOT NULL CHECK (target >= 0),
    current INTEGER DEFAULT 0 NOT NULL CHECK (current >= 0),
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    linked_yearly_goal_id UUID REFERENCES public.yearly_goals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Monthly goals table
CREATE TABLE IF NOT EXISTS public.monthly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    month DATE NOT NULL,
    target INTEGER NOT NULL CHECK (target >= 0),
    current INTEGER DEFAULT 0 NOT NULL CHECK (current >= 0),
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    linked_yearly_goal_id UUID REFERENCES public.yearly_goals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_type ON public.habits(type);
CREATE INDEX IF NOT EXISTS idx_habits_is_archived ON public.habits(is_archived);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);

CREATE INDEX IF NOT EXISTS idx_weekly_targets_habit_id ON public.weekly_targets(habit_id);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_week_start ON public.weekly_targets(week_start);

CREATE INDEX IF NOT EXISTS idx_streak_freezes_habit_id ON public.streak_freezes(habit_id);
CREATE INDEX IF NOT EXISTS idx_streak_freezes_date ON public.streak_freezes(date);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON public.daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON public.daily_tasks(date);

CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON public.weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week_start ON public.weekly_goals(week_start);

CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_id ON public.monthly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_month ON public.monthly_goals(month);

CREATE INDEX IF NOT EXISTS idx_yearly_goals_user_id ON public.yearly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_yearly_goals_year ON public.yearly_goals(year);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit logs" ON public.habit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON public.habit_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Weekly targets policies
CREATE POLICY "Users can view own weekly targets" ON public.weekly_targets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly targets" ON public.weekly_targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly targets" ON public.weekly_targets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly targets" ON public.weekly_targets
    FOR DELETE USING (auth.uid() = user_id);

-- Streak freezes policies
CREATE POLICY "Users can view own streak freezes" ON public.streak_freezes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own streak freezes" ON public.streak_freezes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak freezes" ON public.streak_freezes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own streak freezes" ON public.streak_freezes
    FOR DELETE USING (auth.uid() = user_id);

-- Daily tasks policies
CREATE POLICY "Users can view own daily tasks" ON public.daily_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily tasks" ON public.daily_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks" ON public.daily_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tasks" ON public.daily_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Weekly goals policies
CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly goals" ON public.weekly_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly goals" ON public.weekly_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly goals policies
CREATE POLICY "Users can view own monthly goals" ON public.monthly_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monthly goals" ON public.monthly_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly goals" ON public.monthly_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly goals" ON public.monthly_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Yearly goals policies
CREATE POLICY "Users can view own yearly goals" ON public.yearly_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own yearly goals" ON public.yearly_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yearly goals" ON public.yearly_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own yearly goals" ON public.yearly_goals
    FOR DELETE USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, settings)
    VALUES (
        NEW.id,
        NEW.email,
        jsonb_build_object(
            'dark_mode', false,
            'notification_preferences', jsonb_build_object(
                'daily_reminder', true,
                'daily_reminder_time', '09:00',
                'weekly_planning_reminder', true,
                'monthly_planning_reminder', true
            )
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
