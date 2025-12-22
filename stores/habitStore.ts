import { create } from 'zustand';
import * as db from '../lib/database';
import { calculateStreak, calculateCompletionRate, getWeeklyProgress, formatDate, getWeekStart, getToday, getTodayString } from '../lib/utils';
import type { Habit, HabitLog, WeeklyTarget, StreakFreeze, HabitWithStats, WeeklyHabitWithProgress } from '../types/database';

interface HabitState {
  dailyHabits: HabitWithStats[];
  weeklyHabits: WeeklyHabitWithProgress[];
  allHabits: Habit[];
  archivedHabits: Habit[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHabits: (userId: string) => Promise<void>;
  fetchArchivedHabits: (userId: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => Promise<Habit>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  restoreHabit: (habitId: string, userId: string) => Promise<void>;
  reorderHabits: (habits: { id: string; order: number }[]) => Promise<void>;
  logHabit: (habitId: string, userId: string, date: string, completed: boolean, amount?: number) => Promise<void>;
  deleteHabitLog: (habitId: string, date: string, userId: string) => Promise<void>;
  setWeeklyTarget: (habitId: string, userId: string, weekStart: string, target: number) => Promise<void>;
  addStreakFreeze: (habitId: string, userId: string, date: string) => Promise<void>;
  removeStreakFreeze: (habitId: string, date: string, userId: string) => Promise<void>;
  getHabitWithLogs: (habitId: string) => Promise<{ habit: Habit; logs: HabitLog[]; freezes: StreakFreeze[] } | null>;
  clearError: () => void;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  dailyHabits: [],
  weeklyHabits: [],
  allHabits: [],
  archivedHabits: [],
  isLoading: false,
  error: null,

  fetchHabits: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const today = getTodayString();
      const weekStart = formatDate(getWeekStart());

      // Fetch all habits
      const [dailyHabits, weeklyHabits] = await Promise.all([
        db.getHabits(userId, 'daily'),
        db.getHabits(userId, 'weekly'),
      ]);

      // Filter habits that have started (start_date <= today)
      const activeDailyHabits = dailyHabits.filter((h) => h.start_date <= today);
      const activeWeeklyHabits = weeklyHabits.filter((h) => h.start_date <= today);

      // Fetch logs and freezes for daily habits to calculate stats
      const dailyHabitsWithStats: HabitWithStats[] = await Promise.all(
        activeDailyHabits.map(async (habit) => {
          const [logs, freezes, todayLogs] = await Promise.all([
            db.getHabitLogs(habit.id),
            db.getStreakFreezes(habit.id),
            db.getHabitLogsForDate(userId, today),
          ]);

          const { currentStreak, longestStreak } = calculateStreak(logs, freezes, habit.start_date);
          const completionRate = calculateCompletionRate(logs, habit.start_date);
          const todayLog = todayLogs.find((l) => l.habit_id === habit.id);

          return {
            ...habit,
            currentStreak,
            longestStreak,
            completionRate,
            todayLog,
          };
        })
      );

      // Fetch weekly targets and logs for weekly habits
      const weeklyHabitsWithProgress: WeeklyHabitWithProgress[] = await Promise.all(
        activeWeeklyHabits.map(async (habit) => {
          const [weeklyTarget, logs] = await Promise.all([
            db.getWeeklyTarget(habit.id, weekStart),
            db.getHabitLogs(habit.id, weekStart, formatDate(new Date())),
          ]);

          const currentProgress = getWeeklyProgress(logs, getWeekStart());

          return {
            ...habit,
            weeklyTarget: weeklyTarget || undefined,
            currentProgress,
            logs,
          };
        })
      );

      // Sort: habits without today's log first, then by order
      const sortedDailyHabits = dailyHabitsWithStats.sort((a, b) => {
        const aHasLog = a.todayLog !== undefined;
        const bHasLog = b.todayLog !== undefined;
        if (aHasLog !== bHasLog) {
          return aHasLog ? 1 : -1;
        }
        return a.order - b.order;
      });

      set({
        dailyHabits: sortedDailyHabits,
        weeklyHabits: weeklyHabitsWithProgress,
        allHabits: [...dailyHabits, ...weeklyHabits],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch habits' });
    }
  },

  fetchArchivedHabits: async (userId: string) => {
    try {
      const archived = await db.getArchivedHabits(userId);
      set({ archivedHabits: archived });
    } catch (error) {
      set({ error: 'Failed to fetch archived habits' });
    }
  },

  createHabit: async (habit) => {
    set({ isLoading: true, error: null });
    try {
      const newHabit = await db.createHabit(habit);
      // Refresh habits
      await get().fetchHabits(habit.user_id);
      return newHabit;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create habit' });
      throw error;
    }
  },

  updateHabit: async (habitId: string, updates: Partial<Habit>) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateHabit(habitId, updates);
      // Find the habit to get user_id
      const habit = get().allHabits.find((h) => h.id === habitId);
      if (habit) {
        await get().fetchHabits(habit.user_id);
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update habit' });
    }
  },

  archiveHabit: async (habitId: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.archiveHabit(habitId);
      const habit = get().allHabits.find((h) => h.id === habitId);
      if (habit) {
        await get().fetchHabits(habit.user_id);
        await get().fetchArchivedHabits(habit.user_id);
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to archive habit' });
    }
  },

  deleteHabit: async (habitId: string) => {
    set({ isLoading: true, error: null });
    try {
      const habit = get().allHabits.find((h) => h.id === habitId);
      await db.deleteHabit(habitId);
      if (habit) {
        await get().fetchHabits(habit.user_id);
        await get().fetchArchivedHabits(habit.user_id);
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to delete habit' });
    }
  },

  restoreHabit: async (habitId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.restoreHabit(habitId);
      await get().fetchHabits(userId);
      await get().fetchArchivedHabits(userId);
    } catch (error) {
      set({ isLoading: false, error: 'Failed to restore habit' });
    }
  },

  reorderHabits: async (habits) => {
    try {
      await db.reorderHabits(habits);
      // Optimistically update local state
      const { dailyHabits, weeklyHabits } = get();
      const updatedDaily = dailyHabits.map((h) => {
        const update = habits.find((u) => u.id === h.id);
        return update ? { ...h, order: update.order } : h;
      }).sort((a, b) => a.order - b.order);
      const updatedWeekly = weeklyHabits.map((h) => {
        const update = habits.find((u) => u.id === h.id);
        return update ? { ...h, order: update.order } : h;
      }).sort((a, b) => a.order - b.order);
      set({ dailyHabits: updatedDaily, weeklyHabits: updatedWeekly });
    } catch (error) {
      set({ error: 'Failed to reorder habits' });
    }
  },

  logHabit: async (habitId: string, userId: string, date: string, completed: boolean, amount?: number) => {
    try {
      await db.logHabit(habitId, userId, date, completed, amount);
      await get().fetchHabits(userId);
    } catch (error) {
      set({ error: 'Failed to log habit' });
    }
  },

  deleteHabitLog: async (habitId: string, date: string, userId: string) => {
    try {
      await db.deleteHabitLog(habitId, date);
      await get().fetchHabits(userId);
    } catch (error) {
      set({ error: 'Failed to delete habit log' });
    }
  },

  setWeeklyTarget: async (habitId: string, userId: string, weekStart: string, target: number) => {
    try {
      await db.setWeeklyTarget(habitId, userId, weekStart, target);
      await get().fetchHabits(userId);
    } catch (error) {
      set({ error: 'Failed to set weekly target' });
    }
  },

  addStreakFreeze: async (habitId: string, userId: string, date: string) => {
    try {
      await db.addStreakFreeze(habitId, userId, date);
      await get().fetchHabits(userId);
    } catch (error) {
      set({ error: 'Failed to add streak freeze' });
    }
  },

  removeStreakFreeze: async (habitId: string, date: string, userId: string) => {
    try {
      await db.removeStreakFreeze(habitId, date);
      await get().fetchHabits(userId);
    } catch (error) {
      set({ error: 'Failed to remove streak freeze' });
    }
  },

  getHabitWithLogs: async (habitId: string) => {
    try {
      const habit = await db.getHabit(habitId);
      if (!habit) return null;

      const [logs, freezes] = await Promise.all([
        db.getHabitLogs(habitId),
        db.getStreakFreezes(habitId),
      ]);

      return { habit, logs, freezes };
    } catch (error) {
      set({ error: 'Failed to get habit details' });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
