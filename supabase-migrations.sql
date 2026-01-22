-- ===========================================
-- ARC APP - SUPABASE MIGRATIONS
-- Run these in your Supabase SQL Editor
-- ===========================================

-- 1. Add category field to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- 2. Add priority and order fields to weekly_goals table
ALTER TABLE weekly_goals ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2; -- 1=high, 2=medium, 3=low
ALTER TABLE weekly_goals ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 3. Add priority and order fields to monthly_goals table
ALTER TABLE monthly_goals ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2; -- 1=high, 2=medium, 3=low
ALTER TABLE monthly_goals ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 4. Add order field to yearly_goals table (for drag-to-reorder)
ALTER TABLE yearly_goals ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 5. Create index for faster sorting queries
CREATE INDEX IF NOT EXISTS idx_weekly_goals_priority ON weekly_goals(user_id, week_start, priority, "order");
CREATE INDEX IF NOT EXISTS idx_monthly_goals_priority ON monthly_goals(user_id, month, priority, "order");
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(user_id, category);

-- ===========================================
-- 6. Add track_daily field to weekly_goals table
-- Enables daily progress tracking on a calendar view
-- ===========================================
ALTER TABLE weekly_goals ADD COLUMN IF NOT EXISTS track_daily BOOLEAN DEFAULT FALSE;

-- ===========================================
-- 7. Create weekly_goal_daily_logs table
-- Stores daily progress logs for weekly goals with track_daily enabled
-- ===========================================
CREATE TABLE IF NOT EXISTS weekly_goal_daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_goal_id UUID NOT NULL REFERENCES weekly_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(weekly_goal_id, date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_weekly_goal_daily_logs_goal ON weekly_goal_daily_logs(weekly_goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goal_daily_logs_user_date ON weekly_goal_daily_logs(user_id, date);

-- Enable Row Level Security
ALTER TABLE weekly_goal_daily_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see/edit their own logs)
CREATE POLICY "Users can view their own weekly goal daily logs"
  ON weekly_goal_daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goal daily logs"
  ON weekly_goal_daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goal daily logs"
  ON weekly_goal_daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goal daily logs"
  ON weekly_goal_daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- VERIFY THE CHANGES (run to check)
-- ===========================================

-- Check habits table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'habits';

-- Check weekly_goals table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'weekly_goals';

-- Check monthly_goals table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'monthly_goals';

-- Check weekly_goal_daily_logs table structure
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'weekly_goal_daily_logs';
