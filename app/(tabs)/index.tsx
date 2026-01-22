import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useDailyTasks, useWeeklyGoals } from '../../hooks/useGoals';
import { SwipeableHabit } from '../../components/SwipeableHabit';
import { TaskItem } from '../../components/TaskItem';
import { GoalCard } from '../../components/GoalCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddHabitModal } from '../../components/AddHabitModal';
import { AmountInputModal } from '../../components/AmountInputModal';
import { formatDisplayDate, getToday, getTodayString, formatDate, getWeekStart, isSunday } from '../../lib/utils';
import { addDays, subDays, isToday } from 'date-fns';
import * as db from '../../lib/database';
import type { HabitLog, StreakFreeze } from '../../types/database';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    dailyHabits,
    isLoading: habitsLoading,
    refresh: refreshHabits,
    createHabit,
    logHabit,
    deleteHabitLog,
    addStreakFreeze,
    removeStreakFreeze,
  } = useHabits();
  const {
    dailyTasks,
    isLoading: tasksLoading,
    refresh: refreshTasks,
    createDailyTask,
    deleteDailyTask,
    toggleComplete,
    updatePriority,
    updateDailyTask,
  } = useDailyTasks();

  const {
    weeklyGoals,
    refresh: refreshWeeklyGoals,
    setSelectedWeek,
    incrementWeeklyGoal,
  } = useWeeklyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedDateLogs, setSelectedDateLogs] = useState<HabitLog[]>([]);
  const [selectedDateFreezes, setSelectedDateFreezes] = useState<StreakFreeze[]>([]);
  const [goalAmountModal, setGoalAmountModal] = useState<{
    visible: boolean;
    goalId: string;
    goalName: string;
    current: number;
  }>({ visible: false, goalId: '', goalName: '', current: 0 });
  const [newTaskPriority, setNewTaskPriority] = useState<number>(5); // Default to Medium

  const today = getToday();
  const todayStr = getTodayString();
  const selectedDateStr = formatDate(selectedDate);
  const isSelectedToday = isToday(selectedDate);
  const weekStart = formatDate(getWeekStart());
  const selectedWeekStart = formatDate(getWeekStart(selectedDate));

  // Refresh tasks when selected date changes
  useEffect(() => {
    refreshTasks(selectedDateStr);
  }, [selectedDateStr, refreshTasks]);

  // Fetch habit logs and freezes for the selected date
  useEffect(() => {
    fetchSelectedDateData();
  }, [fetchSelectedDateData]);

  // Refresh weekly goals when selected week changes
  useEffect(() => {
    setSelectedWeek(selectedWeekStart);
    refreshWeeklyGoals(selectedWeekStart);
  }, [selectedWeekStart, setSelectedWeek, refreshWeeklyGoals]);

  const goToPreviousDay = () => {
    Haptics.selectionAsync();
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    Haptics.selectionAsync();
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    Haptics.selectionAsync();
    setSelectedDate(getToday());
  };

  // Show weekly planning prompt on Sundays
  const showWeeklyPrompt = isSunday();

  const fetchSelectedDateData = useCallback(async () => {
    if (!user) return;
    try {
      const [logs, freezes] = await Promise.all([
        db.getHabitLogsForDate(user.id, selectedDateStr),
        db.getStreakFreezesForDate(user.id, selectedDateStr),
      ]);
      setSelectedDateLogs(logs);
      setSelectedDateFreezes(freezes);
    } catch (error) {
      console.error('Failed to fetch habit data for selected date:', error);
    }
  }, [user, selectedDateStr]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshHabits(),
      refreshTasks(selectedDateStr),
      refreshWeeklyGoals(selectedWeekStart),
      fetchSelectedDateData(),
    ]);
    setRefreshing(false);
  }, [refreshHabits, refreshTasks, refreshWeeklyGoals, selectedDateStr, selectedWeekStart, fetchSelectedDateData]);

  const handleSwipeRight = useCallback(
    async (habitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logHabit(habitId, selectedDateStr, true);
      await fetchSelectedDateData();
    },
    [logHabit, selectedDateStr, fetchSelectedDateData]
  );

  const handleSwipeLeft = useCallback(
    async (habitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await logHabit(habitId, selectedDateStr, false);
      await fetchSelectedDateData();
    },
    [logHabit, selectedDateStr, fetchSelectedDateData]
  );

  const handleHabitPress = useCallback((habitId: string) => {
    Haptics.selectionAsync();
    router.push(`/habit/${habitId}`);
  }, []);

  const handleFreezeHabit = useCallback(
    async (habitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addStreakFreeze(habitId, selectedDateStr);
      await fetchSelectedDateData();
    },
    [addStreakFreeze, selectedDateStr, fetchSelectedDateData]
  );

  const handleUnfreezeHabit = useCallback(
    async (habitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await removeStreakFreeze(habitId, selectedDateStr);
      await fetchSelectedDateData();
    },
    [removeStreakFreeze, selectedDateStr, fetchSelectedDateData]
  );

  const handleClearHabitLog = useCallback(
    async (habitId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await deleteHabitLog(habitId, selectedDateStr);
      await fetchSelectedDateData();
    },
    [deleteHabitLog, selectedDateStr, fetchSelectedDateData]
  );

  const handleAddTask = useCallback(async () => {
    if (!newTaskName.trim()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createDailyTask(newTaskName.trim(), selectedDateStr, newTaskPriority);
      setNewTaskName('');
      setNewTaskPriority(5); // Reset to Medium
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  }, [newTaskName, createDailyTask, selectedDateStr, newTaskPriority]);

  const cyclePriority = useCallback(() => {
    Haptics.selectionAsync();
    setNewTaskPriority((prev) => {
      if (prev < 5) return 5; // Low -> Med
      if (prev < 8) return 9; // Med -> High
      return 3; // High -> Low
    });
  }, []);

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return colors.error; // High - red
    if (priority >= 5) return colors.warning; // Med - orange
    return colors.textTertiary; // Low - gray
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Med';
    return 'Low';
  };

  const handleEditTask = useCallback(
    async (taskId: string, name: string) => {
      try {
        await updateDailyTask(taskId, { name });
      } catch (error) {
        Alert.alert('Error', 'Failed to update task');
      }
    },
    [updateDailyTask]
  );

  const handleAddHabit = useCallback(
    async (habit: Parameters<typeof createHabit>[0] & { category?: string }) => {
      try {
        await createHabit({
          name: habit.name,
          type: 'daily',
          start_date: habit.start_date,
          is_archived: false,
          order: dailyHabits.length,
          linked_yearly_goal_id: habit.linked_yearly_goal_id,
          category: habit.category,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to create habit');
      }
    },
    [createHabit, dailyHabits.length]
  );

  const handleOpenGoalAmountModal = useCallback((goal: typeof weeklyGoals[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoalAmountModal({
      visible: true,
      goalId: goal.id,
      goalName: goal.name,
      current: goal.current,
    });
  }, []);

  const handleQuickIncrementGoal = useCallback(
    async (goalId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await incrementWeeklyGoal(goalId, 1);
    },
    [incrementWeeklyGoal]
  );

  const handleIncrementGoal = useCallback(
    async (amount: number) => {
      await incrementWeeklyGoal(goalAmountModal.goalId, amount);
    },
    [incrementWeeklyGoal, goalAmountModal.goalId]
  );

  // Filter habits that have started by the selected date
  const visibleDailyHabits = dailyHabits.filter(
    (habit) => habit.start_date <= selectedDateStr
  );

  const incompleteTasks = dailyTasks.filter((t) => !t.completed);
  const completedTasks = dailyTasks.filter((t) => t.completed);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Date Header with Navigation */}
        <View style={[styles.dateNav, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday} style={styles.dateInfo}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDisplayDate(selectedDate)}
            </Text>
            {isSelectedToday && (
              <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
            {!isSelectedToday && (
              <Text style={[styles.tapToReturn, { color: colors.textTertiary }]}>
                Tap to return to today
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekly Planning Prompt */}
        {showWeeklyPrompt && (
          <TouchableOpacity
            style={[styles.planningBanner, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/plan-week')}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.primary }]}>
              Plan your week
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Tasks Section */}
        <SectionHeader title="Tasks" />
        <View style={styles.taskInput}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add a task..."
            placeholderTextColor={colors.textTertiary}
            value={newTaskName}
            onChangeText={setNewTaskName}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.priorityButton,
              { backgroundColor: getPriorityColor(newTaskPriority) + '20' },
            ]}
            onPress={cyclePriority}
          >
            <Text style={[styles.priorityButtonText, { color: getPriorityColor(newTaskPriority) }]}>
              {getPriorityLabel(newTaskPriority)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTask}
            disabled={!newTaskName.trim()}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {dailyTasks.length === 0 ? (
          <View style={styles.emptyTasks}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks for {isSelectedToday ? 'today' : 'this day'}
            </Text>
          </View>
        ) : (
          <>
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleComplete}
                onDelete={deleteDailyTask}
                onPriorityChange={updatePriority}
                onEdit={handleEditTask}
              />
            ))}
            {completedTasks.length > 0 && (
              <View style={styles.completedSection}>
                <Text style={[styles.completedHeader, { color: colors.textSecondary }]}>
                  Completed ({completedTasks.length})
                </Text>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleComplete}
                    onDelete={deleteDailyTask}
                    onEdit={handleEditTask}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Daily Habits Section */}
        <SectionHeader title="Daily Habits" onAdd={() => setShowAddHabit(true)} />
        {visibleDailyHabits.length === 0 ? (
          <EmptyState
            icon="fitness-outline"
            title="No daily habits yet"
            message="Swipe right to mark as done, left to skip"
            actionLabel="Add Your First Habit"
            onAction={() => setShowAddHabit(true)}
          />
        ) : (
          visibleDailyHabits.map((habit) => {
            const habitLog = selectedDateLogs.find((l) => l.habit_id === habit.id);
            const habitFrozen = selectedDateFreezes.some((f) => f.habit_id === habit.id);
            return (
              <SwipeableHabit
                key={habit.id}
                habit={habit}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onPress={handleHabitPress}
                onFreeze={handleFreezeHabit}
                onUnfreeze={handleUnfreezeHabit}
                onClearLog={handleClearHabitLog}
                selectedDate={selectedDateStr}
                selectedDateLog={habitLog ? { completed: habitLog.completed } : undefined}
                isSelectedDateFrozen={habitFrozen}
              />
            );
          })
        )}

        {/* Weekly Goals Section */}
        {weeklyGoals.length > 0 && (
          <>
            <SectionHeader title="Weekly Goals" />
            {weeklyGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                name={goal.name}
                current={goal.current}
                target={goal.target}
                isRecurring={goal.is_recurring}
                priority={goal.priority}
                onPress={selectedWeekStart === weekStart ? () => handleOpenGoalAmountModal(goal) : () => router.push(`/goal/${goal.id}?type=weekly`)}
                onIncrement={selectedWeekStart === weekStart ? () => handleQuickIncrementGoal(goal.id) : undefined}
              />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddHabitModal
        visible={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onSubmit={handleAddHabit}
        type="daily"
      />

      <AmountInputModal
        visible={goalAmountModal.visible}
        habitName={goalAmountModal.goalName}
        currentDayAmount={goalAmountModal.current}
        onClose={() => setGoalAmountModal((prev) => ({ ...prev, visible: false }))}
        onSubmit={handleIncrementGoal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 8,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  dateInfo: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  todayBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapToReturn: {
    fontSize: 11,
    marginTop: 4,
  },
  planningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  taskInput: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
  },
  priorityButton: {
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addTaskButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTasks: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  completedSection: {
    marginTop: 16,
    opacity: 0.7,
  },
  completedHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 24,
  },
});
