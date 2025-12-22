import { useEffect, useCallback } from 'react';
import { useHabitStore } from '../stores/habitStore';
import { useAuth } from './useAuth';

export const useHabits = () => {
  const { user } = useAuth();
  const {
    dailyHabits,
    weeklyHabits,
    allHabits,
    archivedHabits,
    isLoading,
    error,
    fetchHabits,
    fetchArchivedHabits,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    restoreHabit,
    reorderHabits,
    logHabit,
    deleteHabitLog,
    setWeeklyTarget,
    addStreakFreeze,
    removeStreakFreeze,
    getHabitWithLogs,
    clearError,
  } = useHabitStore();

  const refresh = useCallback(async () => {
    if (user) {
      await fetchHabits(user.id);
    }
  }, [user, fetchHabits]);

  const refreshArchived = useCallback(async () => {
    if (user) {
      await fetchArchivedHabits(user.id);
    }
  }, [user, fetchArchivedHabits]);

  useEffect(() => {
    if (user) {
      fetchHabits(user.id);
    }
  }, [user, fetchHabits]);

  return {
    dailyHabits,
    weeklyHabits,
    allHabits,
    archivedHabits,
    isLoading,
    error,
    refresh,
    refreshArchived,
    createHabit: user
      ? (habit: Parameters<typeof createHabit>[0]) => createHabit({ ...habit, user_id: user.id })
      : async () => {
          throw new Error('Not authenticated');
        },
    updateHabit,
    archiveHabit,
    deleteHabit,
    restoreHabit: user
      ? (habitId: string) => restoreHabit(habitId, user.id)
      : async () => {},
    reorderHabits,
    logHabit: user
      ? (habitId: string, date: string, completed: boolean) =>
          logHabit(habitId, user.id, date, completed)
      : async () => {},
    deleteHabitLog: user
      ? (habitId: string, date: string) => deleteHabitLog(habitId, date, user.id)
      : async () => {},
    setWeeklyTarget: user
      ? (habitId: string, weekStart: string, target: number) =>
          setWeeklyTarget(habitId, user.id, weekStart, target)
      : async () => {},
    addStreakFreeze: user
      ? (habitId: string, date: string) => addStreakFreeze(habitId, user.id, date)
      : async () => {},
    removeStreakFreeze: user
      ? (habitId: string, date: string) => removeStreakFreeze(habitId, date, user.id)
      : async () => {},
    getHabitWithLogs,
    clearError,
  };
};
