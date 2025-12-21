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
import { formatDisplayDate, getToday, getTodayString, formatDate, getWeekStart, isSunday } from '../../lib/utils';

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
  } = useHabits();
  const {
    dailyTasks,
    isLoading: tasksLoading,
    refresh: refreshTasks,
    createDailyTask,
    deleteDailyTask,
    toggleComplete,
  } = useDailyTasks();

  const [refreshing, setRefreshing] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitType, setHabitType] = useState<'daily' | 'weekly'>('daily');

  const today = getToday();
  const todayStr = getTodayString();
  const weekStart = formatDate(getWeekStart());

  // Show weekly planning prompt on Sundays
  const showWeeklyPrompt = isSunday();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshTasks()]);
    setRefreshing(false);
  }, [refreshHabits, refreshTasks]);

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

  const handleAddTask = useCallback(async () => {
    if (!newTaskName.trim()) return;
    try {
      await createDailyTask(newTaskName.trim());
      setNewTaskName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  }, [newTaskName, createDailyTask]);

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

  const handleIncrementWeeklyHabit = useCallback(
    async (habitId: string) => {
      await logHabit(habitId, todayStr, true);
    },
    [logHabit, todayStr]
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDisplayDate(today)}
          </Text>
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
              No tasks for today
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
              onIncrement={() => handleIncrementWeeklyHabit(habit.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  planningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  taskInput: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  addTaskButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTasks: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  completedSection: {
    marginTop: 12,
  },
  completedHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
