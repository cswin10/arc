import { useEffect, useCallback } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { useAuth } from './useAuth';
import { formatDate, getToday } from '../lib/utils';

export const useDailyTasks = () => {
  const { user } = useAuth();
  const {
    dailyTasks,
    isLoading,
    error,
    fetchDailyTasks,
    createDailyTask,
    updateDailyTask,
    deleteDailyTask,
    toggleDailyTaskComplete,
    clearError,
  } = useGoalStore();

  const refresh = useCallback(
    async (date?: string) => {
      if (user) {
        await fetchDailyTasks(user.id, date);
      }
    },
    [user, fetchDailyTasks]
  );

  useEffect(() => {
    if (user) {
      fetchDailyTasks(user.id);
    }
  }, [user, fetchDailyTasks]);

  return {
    dailyTasks,
    isLoading,
    error,
    refresh,
    createDailyTask: user
      ? (name: string, date?: string) =>
          createDailyTask({
            user_id: user.id,
            name,
            date: date || formatDate(getToday()),
            completed: false,
            order: dailyTasks.length,
          })
      : async () => {
          throw new Error('Not authenticated');
        },
    updateDailyTask: user
      ? (taskId: string, updates: Parameters<typeof updateDailyTask>[1]) =>
          updateDailyTask(taskId, updates, user.id)
      : async () => {},
    deleteDailyTask: user ? (taskId: string) => deleteDailyTask(taskId, user.id) : async () => {},
    toggleComplete: user
      ? (taskId: string, completed: boolean) => toggleDailyTaskComplete(taskId, completed, user.id)
      : async () => {},
    clearError,
  };
};

export const useWeeklyGoals = () => {
  const { user } = useAuth();
  const {
    weeklyGoals,
    selectedWeekStart,
    isLoading,
    error,
    fetchWeeklyGoals,
    createWeeklyGoal,
    updateWeeklyGoal,
    incrementWeeklyGoal,
    archiveWeeklyGoal,
    copyRecurringToNextWeek,
    setSelectedWeek,
    clearError,
  } = useGoalStore();

  const refresh = useCallback(
    async (weekStart?: string) => {
      if (user) {
        await fetchWeeklyGoals(user.id, weekStart);
      }
    },
    [user, fetchWeeklyGoals]
  );

  useEffect(() => {
    if (user) {
      fetchWeeklyGoals(user.id);
    }
  }, [user, fetchWeeklyGoals]);

  return {
    weeklyGoals,
    selectedWeekStart,
    isLoading,
    error,
    refresh,
    createWeeklyGoal: user
      ? (goal: Omit<Parameters<typeof createWeeklyGoal>[0], 'user_id'>) =>
          createWeeklyGoal({ ...goal, user_id: user.id })
      : async () => {
          throw new Error('Not authenticated');
        },
    updateWeeklyGoal: user
      ? (goalId: string, updates: Parameters<typeof updateWeeklyGoal>[1]) =>
          updateWeeklyGoal(goalId, updates, user.id)
      : async () => {},
    incrementWeeklyGoal: user
      ? (goalId: string) => incrementWeeklyGoal(goalId, user.id)
      : async () => {},
    archiveWeeklyGoal: user
      ? (goalId: string) => archiveWeeklyGoal(goalId, user.id)
      : async () => {},
    copyRecurringToNextWeek: user ? () => copyRecurringToNextWeek(user.id) : async () => {},
    setSelectedWeek,
    clearError,
  };
};

export const useMonthlyGoals = () => {
  const { user } = useAuth();
  const {
    monthlyGoals,
    selectedMonth,
    isLoading,
    error,
    fetchMonthlyGoals,
    createMonthlyGoal,
    updateMonthlyGoal,
    incrementMonthlyGoal,
    archiveMonthlyGoal,
    setSelectedMonth,
    clearError,
  } = useGoalStore();

  const refresh = useCallback(
    async (month?: string) => {
      if (user) {
        await fetchMonthlyGoals(user.id, month);
      }
    },
    [user, fetchMonthlyGoals]
  );

  useEffect(() => {
    if (user) {
      fetchMonthlyGoals(user.id);
    }
  }, [user, fetchMonthlyGoals]);

  return {
    monthlyGoals,
    selectedMonth,
    isLoading,
    error,
    refresh,
    createMonthlyGoal: user
      ? (goal: Omit<Parameters<typeof createMonthlyGoal>[0], 'user_id'>) =>
          createMonthlyGoal({ ...goal, user_id: user.id })
      : async () => {
          throw new Error('Not authenticated');
        },
    updateMonthlyGoal: user
      ? (goalId: string, updates: Parameters<typeof updateMonthlyGoal>[1]) =>
          updateMonthlyGoal(goalId, updates, user.id)
      : async () => {},
    incrementMonthlyGoal: user
      ? (goalId: string) => incrementMonthlyGoal(goalId, user.id)
      : async () => {},
    archiveMonthlyGoal: user
      ? (goalId: string) => archiveMonthlyGoal(goalId, user.id)
      : async () => {},
    setSelectedMonth,
    clearError,
  };
};

export const useYearlyGoals = () => {
  const { user } = useAuth();
  const {
    yearlyGoals,
    allYearlyGoals,
    selectedYear,
    isLoading,
    error,
    fetchYearlyGoals,
    fetchAllYearlyGoals,
    createYearlyGoal,
    updateYearlyGoal,
    incrementYearlyGoal,
    archiveYearlyGoal,
    getLinkedItems,
    setSelectedYear,
    clearError,
  } = useGoalStore();

  const refresh = useCallback(
    async (year?: number) => {
      if (user) {
        await fetchYearlyGoals(user.id, year);
      }
    },
    [user, fetchYearlyGoals]
  );

  const refreshAll = useCallback(async () => {
    if (user) {
      await fetchAllYearlyGoals(user.id);
    }
  }, [user, fetchAllYearlyGoals]);

  useEffect(() => {
    if (user) {
      fetchYearlyGoals(user.id);
      fetchAllYearlyGoals(user.id);
    }
  }, [user, fetchYearlyGoals, fetchAllYearlyGoals]);

  return {
    yearlyGoals,
    allYearlyGoals,
    selectedYear,
    isLoading,
    error,
    refresh,
    refreshAll,
    createYearlyGoal: user
      ? (goal: Omit<Parameters<typeof createYearlyGoal>[0], 'user_id'>) =>
          createYearlyGoal({ ...goal, user_id: user.id })
      : async () => {
          throw new Error('Not authenticated');
        },
    updateYearlyGoal: user
      ? (goalId: string, updates: Parameters<typeof updateYearlyGoal>[1]) =>
          updateYearlyGoal(goalId, updates, user.id)
      : async () => {},
    incrementYearlyGoal: user
      ? (goalId: string) => incrementYearlyGoal(goalId, user.id)
      : async () => {},
    archiveYearlyGoal: user
      ? (goalId: string) => archiveYearlyGoal(goalId, user.id)
      : async () => {},
    getLinkedItems,
    setSelectedYear,
    clearError,
  };
};
