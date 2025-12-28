import React, { useState, useCallback, useEffect } from 'react';
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
import { useDailyTasks } from '../../hooks/useGoals';
import { SwipeableHabit } from '../../components/SwipeableHabit';
import { TaskItem } from '../../components/TaskItem';
import { WeeklyHabitCard } from '../../components/WeeklyHabitCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddHabitModal } from '../../components/AddHabitModal';
import { CompletionPopup } from '../../components/CompletionPopup';
import { AmountInputModal } from '../../components/AmountInputModal';
import { formatDisplayDate, getToday, getTodayString, formatDate, getWeekStart, isSunday } from '../../lib/utils';
import { addDays, subDays, isToday, isSameDay } from 'date-fns';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    dailyHabits,
    weeklyHabits,
    isLoading: habitsLoading,
    refresh: refreshHabits,
    createHabit,
    logHabit,
    setWeeklyTarget,
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
  } = useDailyTasks();

  const [refreshing, setRefreshing] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitType, setHabitType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [completionPopup, setCompletionPopup] = useState<{
    visible: boolean;
    habitName: string;
    current: number;
    target: number;
  }>({ visible: false, habitName: '', current: 0, target: 0 });
  const [amountModal, setAmountModal] = useState<{
    visible: boolean;
    habitId: string;
    habitName: string;
    currentDayAmount: number;
  }>({ visible: false, habitId: '', habitName: '', currentDayAmount: 0 });

  const today = getToday();
  const todayStr = getTodayString();
  const selectedDateStr = formatDate(selectedDate);
  const isSelectedToday = isToday(selectedDate);
  const weekStart = formatDate(getWeekStart());

  // Refresh tasks when selected date changes
  useEffect(() => {
    refreshTasks(selectedDateStr);
  }, [selectedDateStr, refreshTasks]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshTasks(selectedDateStr)]);
    setRefreshing(false);
  }, [refreshHabits, refreshTasks, selectedDateStr]);

  const handleSwipeRight = useCallback(
    async (habitId: string) => {
      await logHabit(habitId, todayStr, true);
    },
    [logHabit, todayStr]
  );

  const handleSwipeLeft = useCallback(
    async (habitId: string) => {
      await logHabit(habitId, todayStr, false);
    },
    [logHabit, todayStr]
  );

  const handleHabitPress = useCallback((habitId: string) => {
    router.push(`/habit/${habitId}`);
  }, []);

  const handleFreezeHabit = useCallback(
    async (habitId: string) => {
      await addStreakFreeze(habitId, todayStr);
    },
    [addStreakFreeze, todayStr]
  );

  const handleUnfreezeHabit = useCallback(
    async (habitId: string) => {
      await removeStreakFreeze(habitId, todayStr);
    },
    [removeStreakFreeze, todayStr]
  );

  const handleAddTask = useCallback(async () => {
    if (!newTaskName.trim()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createDailyTask(newTaskName.trim(), selectedDateStr);
      setNewTaskName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  }, [newTaskName, createDailyTask, selectedDateStr]);

  const handleAddHabit = useCallback(
    async (habit: Parameters<typeof createHabit>[0] & { weekly_target?: number }) => {
      try {
        const newHabit = await createHabit({
          name: habit.name,
          type: habit.type,
          start_date: habit.start_date,
          is_archived: false,
          order: habit.type === 'daily' ? dailyHabits.length : weeklyHabits.length,
          linked_yearly_goal_id: habit.linked_yearly_goal_id,
        });

        // If weekly habit, set the initial target
        if (habit.type === 'weekly' && habit.weekly_target) {
          await setWeeklyTarget(newHabit.id, weekStart, habit.weekly_target);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create habit');
      }
    },
    [createHabit, dailyHabits.length, weeklyHabits.length, setWeeklyTarget, weekStart]
  );

  const handleOpenAmountModal = useCallback(
    (habitId: string) => {
      const habit = weeklyHabits.find((h) => h.id === habitId);
      if (!habit) return;

      // Get today's logged amount
      const todayLog = habit.logs?.find((l) => l.date === todayStr);
      const currentDayAmount = todayLog?.amount || 0;

      setAmountModal({
        visible: true,
        habitId,
        habitName: habit.name,
        currentDayAmount,
      });
    },
    [weeklyHabits, todayStr]
  );

  const handleLogAmount = useCallback(
    async (amount: number) => {
      const habit = weeklyHabits.find((h) => h.id === amountModal.habitId);
      if (!habit) return;

      await logHabit(amountModal.habitId, todayStr, true, amount);

      // Show completion popup with updated progress
      const target = habit.weeklyTarget?.target || 0;
      const newCurrent = habit.currentProgress + amount;
      setCompletionPopup({
        visible: true,
        habitName: habit.name,
        current: newCurrent,
        target: target,
      });
    },
    [logHabit, todayStr, weeklyHabits, amountModal.habitId]
  );

  const openAddHabitModal = (type: 'daily' | 'weekly') => {
    setHabitType(type);
    setShowAddHabit(true);
  };

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
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Daily Habits Section */}
        <SectionHeader title="Daily Habits" onAdd={() => openAddHabitModal('daily')} />
        {dailyHabits.length === 0 ? (
          <EmptyState
            icon="fitness-outline"
            title="No daily habits yet"
            message="Swipe right to mark as done, left to skip"
            actionLabel="Add Your First Habit"
            onAction={() => openAddHabitModal('daily')}
          />
        ) : (
          dailyHabits.map((habit) => (
            <SwipeableHabit
              key={habit.id}
              habit={habit}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onPress={handleHabitPress}
              onFreeze={handleFreezeHabit}
              onUnfreeze={handleUnfreezeHabit}
            />
          ))
        )}

        {/* Weekly Habits Section */}
        <SectionHeader title="Weekly" onAdd={() => openAddHabitModal('weekly')} />
        {weeklyHabits.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No weekly habits yet"
            message="Track habits you want to do multiple times per week"
            actionLabel="Add Weekly Habit"
            onAction={() => openAddHabitModal('weekly')}
          />
        ) : (
          weeklyHabits.map((habit) => (
            <WeeklyHabitCard
              key={habit.id}
              habit={habit}
              onPress={() => handleHabitPress(habit.id)}
              onIncrement={() => handleOpenAmountModal(habit.id)}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddHabitModal
        visible={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onSubmit={handleAddHabit}
        type={habitType}
      />

      <CompletionPopup
        visible={completionPopup.visible}
        habitName={completionPopup.habitName}
        current={completionPopup.current}
        target={completionPopup.target}
        onHide={() => setCompletionPopup((prev) => ({ ...prev, visible: false }))}
      />

      <AmountInputModal
        visible={amountModal.visible}
        habitName={amountModal.habitName}
        currentDayAmount={amountModal.currentDayAmount}
        onClose={() => setAmountModal((prev) => ({ ...prev, visible: false }))}
        onSubmit={handleLogAmount}
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
