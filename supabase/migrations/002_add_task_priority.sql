-- Add priority column to daily_tasks table
-- Priority is 1-10, where higher = more important (default 5)

ALTER TABLE public.daily_tasks
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 NOT NULL CHECK (priority >= 1 AND priority <= 10);

-- Create index for sorting by priority
CREATE INDEX IF NOT EXISTS idx_daily_tasks_priority ON public.daily_tasks(priority DESC);
