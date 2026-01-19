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
