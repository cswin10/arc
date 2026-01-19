import { create } from 'zustand';
import * as db from '../lib/database';
import { formatDate, getWeekStart, getMonthStart, getToday } from '../lib/utils';
import type { DailyTask, WeeklyGoal, MonthlyGoal, YearlyGoal, Habit } from '../types/database';

interface GoalState {
  // Daily tasks
  dailyTasks: DailyTask[];

  // Weekly goals
  weeklyGoals: WeeklyGoal[];

  // Monthly goals
  monthlyGoals: MonthlyGoal[];

  // Yearly goals
  yearlyGoals: YearlyGoal[];
  allYearlyGoals: YearlyGoal[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Selected periods
  selectedWeekStart: string;
  selectedMonth: string;
  selectedYear: number;

  // Actions - Daily Tasks
  fetchDailyTasks: (userId: string, date?: string) => Promise<void>;
  createDailyTask: (task: Omit<DailyTask, 'id' | 'created_at'>) => Promise<DailyTask>;
  updateDailyTask: (taskId: string, updates: Partial<DailyTask>, userId: string) => Promise<void>;
  deleteDailyTask: (taskId: string, userId: string) => Promise<void>;
  toggleDailyTaskComplete: (taskId: string, completed: boolean, userId: string) => Promise<void>;

  // Actions - Weekly Goals
  fetchWeeklyGoals: (userId: string, weekStart?: string) => Promise<void>;
  createWeeklyGoal: (goal: Omit<WeeklyGoal, 'id' | 'created_at'>) => Promise<WeeklyGoal>;
  updateWeeklyGoal: (goalId: string, updates: Partial<WeeklyGoal>, userId: string) => Promise<void>;
  incrementWeeklyGoal: (goalId: string, userId: string, amount?: number) => Promise<void>;
  archiveWeeklyGoal: (goalId: string, userId: string) => Promise<void>;
  copyRecurringToNextWeek: (userId: string) => Promise<void>;
  setSelectedWeek: (weekStart: string) => void;

  // Actions - Monthly Goals
  fetchMonthlyGoals: (userId: string, month?: string) => Promise<void>;
  createMonthlyGoal: (goal: Omit<MonthlyGoal, 'id' | 'created_at'>) => Promise<MonthlyGoal>;
  updateMonthlyGoal: (goalId: string, updates: Partial<MonthlyGoal>, userId: string) => Promise<void>;
  incrementMonthlyGoal: (goalId: string, userId: string, amount?: number) => Promise<void>;
  archiveMonthlyGoal: (goalId: string, userId: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;

  // Actions - Yearly Goals
  fetchYearlyGoals: (userId: string, year?: number) => Promise<void>;
  fetchAllYearlyGoals: (userId: string) => Promise<void>;
  createYearlyGoal: (goal: Omit<YearlyGoal, 'id' | 'created_at'>) => Promise<YearlyGoal>;
  updateYearlyGoal: (goalId: string, updates: Partial<YearlyGoal>, userId: string) => Promise<void>;
  incrementYearlyGoal: (goalId: string, userId: string, amount?: number) => Promise<void>;
  archiveYearlyGoal: (goalId: string, userId: string) => Promise<void>;
  getLinkedItems: (yearlyGoalId: string) => Promise<{ habits: Habit[]; weeklyGoals: WeeklyGoal[]; monthlyGoals: MonthlyGoal[] }>;
  setSelectedYear: (year: number) => void;

  // General
  clearError: () => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  dailyTasks: [],
  weeklyGoals: [],
  monthlyGoals: [],
  yearlyGoals: [],
  allYearlyGoals: [],
  isLoading: false,
  error: null,
  selectedWeekStart: formatDate(getWeekStart()),
  selectedMonth: formatDate(getMonthStart()),
  selectedYear: getToday().getFullYear(),

  // ==================== Daily Tasks ====================

  fetchDailyTasks: async (userId: string, date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const targetDate = date || formatDate(getToday());
      const tasks = await db.getDailyTasks(userId, targetDate);

      // Sort: incomplete first, then by order
      const sortedTasks = tasks.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return a.order - b.order;
      });

      set({ dailyTasks: sortedTasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch tasks' });
    }
  },

  createDailyTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await db.createDailyTask(task);
      await get().fetchDailyTasks(task.user_id, task.date);
      return newTask;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create task' });
      throw error;
    }
  },

  updateDailyTask: async (taskId: string, updates: Partial<DailyTask>, userId: string) => {
    try {
      await db.updateDailyTask(taskId, updates);
      await get().fetchDailyTasks(userId);
    } catch (error) {
      set({ error: 'Failed to update task' });
    }
  },

  deleteDailyTask: async (taskId: string, userId: string) => {
    try {
      await db.deleteDailyTask(taskId);
      await get().fetchDailyTasks(userId);
    } catch (error) {
      set({ error: 'Failed to delete task' });
    }
  },

  toggleDailyTaskComplete: async (taskId: string, completed: boolean, userId: string) => {
    try {
      await db.toggleDailyTaskComplete(taskId, completed);
      await get().fetchDailyTasks(userId);
    } catch (error) {
      set({ error: 'Failed to toggle task' });
    }
  },

  // ==================== Weekly Goals ====================

  fetchWeeklyGoals: async (userId: string, weekStart?: string) => {
    set({ isLoading: true, error: null });
    try {
      const targetWeek = weekStart || get().selectedWeekStart;
      const goals = await db.getWeeklyGoals(userId, targetWeek);
      // Sort alphabetically by name, with incomplete goals first
      const sortedGoals = goals.sort((a, b) => {
        const aComplete = a.current >= a.target;
        const bComplete = b.current >= b.target;
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
      set({ weeklyGoals: sortedGoals, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch weekly goals' });
    }
  },

  createWeeklyGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await db.createWeeklyGoal(goal);
      await get().fetchWeeklyGoals(goal.user_id, goal.week_start);
      return newGoal;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create weekly goal' });
      throw error;
    }
  },

  updateWeeklyGoal: async (goalId: string, updates: Partial<WeeklyGoal>, userId: string) => {
    try {
      await db.updateWeeklyGoal(goalId, updates);
      await get().fetchWeeklyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to update weekly goal' });
    }
  },

  incrementWeeklyGoal: async (goalId: string, userId: string, amount: number = 1) => {
    try {
      await db.incrementWeeklyGoal(goalId, amount);
      await get().fetchWeeklyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to increment weekly goal' });
    }
  },

  archiveWeeklyGoal: async (goalId: string, userId: string) => {
    try {
      await db.archiveWeeklyGoal(goalId);
      await get().fetchWeeklyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to archive weekly goal' });
    }
  },

  copyRecurringToNextWeek: async (userId: string) => {
    try {
      const currentWeek = get().selectedWeekStart;
      const nextWeek = formatDate(new Date(new Date(currentWeek).getTime() + 7 * 24 * 60 * 60 * 1000));
      await db.copyRecurringWeeklyGoals(userId, currentWeek, nextWeek);
    } catch (error) {
      set({ error: 'Failed to copy recurring goals' });
    }
  },

  setSelectedWeek: (weekStart: string) => {
    set({ selectedWeekStart: weekStart });
  },

  // ==================== Monthly Goals ====================

  fetchMonthlyGoals: async (userId: string, month?: string) => {
    set({ isLoading: true, error: null });
    try {
      const targetMonth = month || get().selectedMonth;
      const goals = await db.getMonthlyGoals(userId, targetMonth);
      // Sort alphabetically by name, with incomplete goals first
      const sortedGoals = goals.sort((a, b) => {
        const aComplete = a.current >= a.target;
        const bComplete = b.current >= b.target;
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
      set({ monthlyGoals: sortedGoals, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch monthly goals' });
    }
  },

  createMonthlyGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await db.createMonthlyGoal(goal);
      await get().fetchMonthlyGoals(goal.user_id, goal.month);
      return newGoal;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create monthly goal' });
      throw error;
    }
  },

  updateMonthlyGoal: async (goalId: string, updates: Partial<MonthlyGoal>, userId: string) => {
    try {
      await db.updateMonthlyGoal(goalId, updates);
      await get().fetchMonthlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to update monthly goal' });
    }
  },

  incrementMonthlyGoal: async (goalId: string, userId: string, amount: number = 1) => {
    try {
      await db.incrementMonthlyGoal(goalId, amount);
      await get().fetchMonthlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to increment monthly goal' });
    }
  },

  archiveMonthlyGoal: async (goalId: string, userId: string) => {
    try {
      await db.archiveMonthlyGoal(goalId);
      await get().fetchMonthlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to archive monthly goal' });
    }
  },

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
  },

  // ==================== Yearly Goals ====================

  fetchYearlyGoals: async (userId: string, year?: number) => {
    // Don't set isLoading to avoid blocking UI - use optimistic rendering
    set({ error: null });
    try {
      const targetYear = year || get().selectedYear;
      const goals = await db.getYearlyGoals(userId, targetYear);
      set({ yearlyGoals: goals });
    } catch (error) {
      set({ error: 'Failed to fetch yearly goals' });
    }
  },

  fetchAllYearlyGoals: async (userId: string) => {
    try {
      const goals = await db.getAllYearlyGoals(userId);
      set({ allYearlyGoals: goals });
    } catch (error) {
      set({ error: 'Failed to fetch all yearly goals' });
    }
  },

  createYearlyGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await db.createYearlyGoal(goal);
      await get().fetchYearlyGoals(goal.user_id, goal.year);
      await get().fetchAllYearlyGoals(goal.user_id);
      return newGoal;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create yearly goal' });
      throw error;
    }
  },

  updateYearlyGoal: async (goalId: string, updates: Partial<YearlyGoal>, userId: string) => {
    try {
      await db.updateYearlyGoal(goalId, updates);
      await get().fetchYearlyGoals(userId);
      await get().fetchAllYearlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to update yearly goal' });
    }
  },

  incrementYearlyGoal: async (goalId: string, userId: string, amount: number = 1) => {
    try {
      await db.incrementYearlyGoal(goalId, amount);
      const { selectedYear } = get();
      await get().fetchYearlyGoals(userId, selectedYear);
      await get().fetchAllYearlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to increment yearly goal' });
    }
  },

  archiveYearlyGoal: async (goalId: string, userId: string) => {
    try {
      await db.archiveYearlyGoal(goalId);
      await get().fetchYearlyGoals(userId);
      await get().fetchAllYearlyGoals(userId);
    } catch (error) {
      set({ error: 'Failed to archive yearly goal' });
    }
  },

  getLinkedItems: async (yearlyGoalId: string) => {
    try {
      return await db.getLinkedItems(yearlyGoalId);
    } catch (error) {
      set({ error: 'Failed to get linked items' });
      return { habits: [], weeklyGoals: [], monthlyGoals: [] };
    }
  },

  setSelectedYear: (year: number) => {
    set({ selectedYear: year });
  },

  // ==================== General ====================

  clearError: () => {
    set({ error: null });
  },
}));
