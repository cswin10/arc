import { supabase } from './supabase';
import { formatDate, getWeekStart, getMonthStart, getTodayString } from './utils';
import type {
  Habit,
  HabitLog,
  WeeklyTarget,
  StreakFreeze,
  DailyTask,
  WeeklyGoal,
  MonthlyGoal,
  YearlyGoal,
} from '../types/database';

// ==================== Habits ====================

export const getHabits = async (userId: string, type?: 'daily' | 'weekly'): Promise<Habit[]> => {
  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('order', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getHabit = async (habitId: string): Promise<Habit | null> => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .single();

  if (error) return null;
  return data;
};

export const createHabit = async (habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit> => {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<Habit> => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const archiveHabit = async (habitId: string): Promise<void> => {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: true })
    .eq('id', habitId);

  if (error) throw error;
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  // Delete related records first
  await supabase.from('habit_logs').delete().eq('habit_id', habitId);
  await supabase.from('streak_freezes').delete().eq('habit_id', habitId);
  await supabase.from('weekly_targets').delete().eq('habit_id', habitId);

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) throw error;
};

export const restoreHabit = async (habitId: string): Promise<void> => {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: false })
    .eq('id', habitId);

  if (error) throw error;
};

export const getArchivedHabits = async (userId: string): Promise<Habit[]> => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const reorderHabits = async (habits: { id: string; order: number }[]): Promise<void> => {
  for (const habit of habits) {
    await supabase.from('habits').update({ order: habit.order }).eq('id', habit.id);
  }
};

// ==================== Habit Logs ====================

export const getHabitLogs = async (
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitLog[]> => {
  let query = supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getHabitLogsForDate = async (
  userId: string,
  date: string
): Promise<HabitLog[]> => {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
  return data || [];
};

export const logHabit = async (
  habitId: string,
  userId: string,
  date: string,
  completed: boolean,
  amount?: number
): Promise<HabitLog> => {
  // Check if log exists for this date
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', date)
    .single();

  if (existing) {
    // Update existing log - add to existing amount if provided
    const newAmount = amount !== undefined
      ? (existing.amount || 0) + amount
      : existing.amount;
    const { data, error } = await supabase
      .from('habit_logs')
      .update({ completed, amount: newAmount })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new log
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, user_id: userId, date, completed, amount: amount || 1 })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const deleteHabitLog = async (habitId: string, date: string): Promise<void> => {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date);

  if (error) throw error;
};

// ==================== Weekly Targets ====================

export const getWeeklyTarget = async (
  habitId: string,
  weekStart: string
): Promise<WeeklyTarget | null> => {
  const { data, error } = await supabase
    .from('weekly_targets')
    .select('*')
    .eq('habit_id', habitId)
    .eq('week_start', weekStart)
    .single();

  if (error) return null;
  return data;
};

export const setWeeklyTarget = async (
  habitId: string,
  userId: string,
  weekStart: string,
  target: number
): Promise<WeeklyTarget> => {
  // Check if target exists
  const existing = await getWeeklyTarget(habitId, weekStart);

  if (existing) {
    const { data, error } = await supabase
      .from('weekly_targets')
      .update({ target })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('weekly_targets')
      .insert({ habit_id: habitId, user_id: userId, week_start: weekStart, target })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== Streak Freezes ====================

export const getStreakFreezes = async (habitId: string): Promise<StreakFreeze[]> => {
  const { data, error } = await supabase
    .from('streak_freezes')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addStreakFreeze = async (
  habitId: string,
  userId: string,
  date: string
): Promise<StreakFreeze> => {
  const { data, error } = await supabase
    .from('streak_freezes')
    .insert({ habit_id: habitId, user_id: userId, date })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeStreakFreeze = async (habitId: string, date: string): Promise<void> => {
  const { error } = await supabase
    .from('streak_freezes')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date);

  if (error) throw error;
};

// ==================== Daily Tasks ====================

export const getDailyTasks = async (userId: string, date: string): Promise<DailyTask[]> => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;

  // Ensure priority has a default value and sort by priority (desc) then name (asc)
  return (data || [])
    .map(task => ({
      ...task,
      priority: task.priority ?? 5
    }))
    .sort((a, b) => {
      // First sort by priority (higher first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
};

export const createDailyTask = async (
  task: Omit<DailyTask, 'id' | 'created_at'>
): Promise<DailyTask> => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateDailyTask = async (
  taskId: string,
  updates: Partial<DailyTask>
): Promise<DailyTask> => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDailyTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);

  if (error) throw error;
};

export const toggleDailyTaskComplete = async (
  taskId: string,
  completed: boolean
): Promise<DailyTask> => {
  return updateDailyTask(taskId, { completed });
};

// ==================== Weekly Goals ====================

export const getWeeklyGoals = async (userId: string, weekStart: string): Promise<WeeklyGoal[]> => {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createWeeklyGoal = async (
  goal: Omit<WeeklyGoal, 'id' | 'created_at'>
): Promise<WeeklyGoal> => {
  const { data, error } = await supabase
    .from('weekly_goals')
    .insert(goal)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWeeklyGoal = async (
  goalId: string,
  updates: Partial<WeeklyGoal>
): Promise<WeeklyGoal> => {
  const { data, error } = await supabase
    .from('weekly_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const incrementWeeklyGoal = async (goalId: string, amount: number = 1): Promise<WeeklyGoal> => {
  const { data: goal } = await supabase
    .from('weekly_goals')
    .select('current')
    .eq('id', goalId)
    .single();

  return updateWeeklyGoal(goalId, { current: (goal?.current || 0) + amount });
};

export const archiveWeeklyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_goals')
    .update({ is_archived: true })
    .eq('id', goalId);

  if (error) throw error;
};

export const deleteWeeklyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
};

// Copy recurring goals to next week
export const copyRecurringWeeklyGoals = async (
  userId: string,
  fromWeekStart: string,
  toWeekStart: string
): Promise<void> => {
  const goals = await getWeeklyGoals(userId, fromWeekStart);
  const recurringGoals = goals.filter((g) => g.is_recurring);

  for (const goal of recurringGoals) {
    await createWeeklyGoal({
      user_id: userId,
      name: goal.name,
      week_start: toWeekStart,
      target: goal.target,
      current: 0,
      is_recurring: true,
      is_archived: false,
      linked_yearly_goal_id: goal.linked_yearly_goal_id,
    });
  }
};

// ==================== Monthly Goals ====================

export const getMonthlyGoals = async (userId: string, month: string): Promise<MonthlyGoal[]> => {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createMonthlyGoal = async (
  goal: Omit<MonthlyGoal, 'id' | 'created_at'>
): Promise<MonthlyGoal> => {
  const { data, error } = await supabase
    .from('monthly_goals')
    .insert(goal)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMonthlyGoal = async (
  goalId: string,
  updates: Partial<MonthlyGoal>
): Promise<MonthlyGoal> => {
  const { data, error } = await supabase
    .from('monthly_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const incrementMonthlyGoal = async (goalId: string, amount: number = 1): Promise<MonthlyGoal> => {
  const { data: goal } = await supabase
    .from('monthly_goals')
    .select('current')
    .eq('id', goalId)
    .single();

  return updateMonthlyGoal(goalId, { current: (goal?.current || 0) + amount });
};

export const archiveMonthlyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('monthly_goals')
    .update({ is_archived: true })
    .eq('id', goalId);

  if (error) throw error;
};

export const deleteMonthlyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('monthly_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
};

// ==================== Yearly Goals ====================

export const getYearlyGoals = async (userId: string, year: number): Promise<YearlyGoal[]> => {
  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getAllYearlyGoals = async (userId: string): Promise<YearlyGoal[]> => {
  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('year', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createYearlyGoal = async (
  goal: Omit<YearlyGoal, 'id' | 'created_at'>
): Promise<YearlyGoal> => {
  const { data, error } = await supabase
    .from('yearly_goals')
    .insert(goal)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateYearlyGoal = async (
  goalId: string,
  updates: Partial<YearlyGoal>
): Promise<YearlyGoal> => {
  const { data, error } = await supabase
    .from('yearly_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const incrementYearlyGoal = async (goalId: string, amount: number = 1): Promise<YearlyGoal> => {
  const { data: goal } = await supabase
    .from('yearly_goals')
    .select('current')
    .eq('id', goalId)
    .single();

  return updateYearlyGoal(goalId, { current: (goal?.current || 0) + amount });
};

export const archiveYearlyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('yearly_goals')
    .update({ is_archived: true })
    .eq('id', goalId);

  if (error) throw error;
};

export const deleteYearlyGoal = async (goalId: string): Promise<void> => {
  // Unlink any linked items first
  await supabase.from('habits').update({ linked_yearly_goal_id: null }).eq('linked_yearly_goal_id', goalId);
  await supabase.from('weekly_goals').update({ linked_yearly_goal_id: null }).eq('linked_yearly_goal_id', goalId);
  await supabase.from('monthly_goals').update({ linked_yearly_goal_id: null }).eq('linked_yearly_goal_id', goalId);

  const { error } = await supabase
    .from('yearly_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
};

// ==================== Archived Items ====================

export const getArchivedWeeklyGoals = async (userId: string): Promise<WeeklyGoal[]> => {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getArchivedMonthlyGoals = async (userId: string): Promise<MonthlyGoal[]> => {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getArchivedYearlyGoals = async (userId: string): Promise<YearlyGoal[]> => {
  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const restoreWeeklyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('weekly_goals')
    .update({ is_archived: false })
    .eq('id', goalId);

  if (error) throw error;
};

export const restoreMonthlyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('monthly_goals')
    .update({ is_archived: false })
    .eq('id', goalId);

  if (error) throw error;
};

export const restoreYearlyGoal = async (goalId: string): Promise<void> => {
  const { error } = await supabase
    .from('yearly_goals')
    .update({ is_archived: false })
    .eq('id', goalId);

  if (error) throw error;
};

// Get items linked to a yearly goal
export const getLinkedItems = async (yearlyGoalId: string): Promise<{
  habits: Habit[];
  weeklyGoals: WeeklyGoal[];
  monthlyGoals: MonthlyGoal[];
}> => {
  const [habitsRes, weeklyRes, monthlyRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('linked_yearly_goal_id', yearlyGoalId)
      .eq('is_archived', false),
    supabase
      .from('weekly_goals')
      .select('*')
      .eq('linked_yearly_goal_id', yearlyGoalId)
      .eq('is_archived', false),
    supabase
      .from('monthly_goals')
      .select('*')
      .eq('linked_yearly_goal_id', yearlyGoalId)
      .eq('is_archived', false),
  ]);

  return {
    habits: habitsRes.data || [],
    weeklyGoals: weeklyRes.data || [],
    monthlyGoals: monthlyRes.data || [],
  };
};

// ==================== Stats ====================

export const getAllHabitLogs = async (userId: string): Promise<HabitLog[]> => {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getHabitLogsForWeek = async (
  userId: string,
  weekStart: string
): Promise<HabitLog[]> => {
  const weekEnd = formatDate(getWeekStart(new Date(weekStart)));
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd);

  if (error) throw error;
  return data || [];
};
