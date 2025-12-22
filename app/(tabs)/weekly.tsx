import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useHabits } from '../../hooks/useHabits';
import { useWeeklyGoals } from '../../hooks/useGoals';
import { GoalCard } from '../../components/GoalCard';
import { WeeklyHabitCard } from '../../components/WeeklyHabitCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddGoalModal } from '../../components/AddGoalModal';
import { CompletionPopup } from '../../components/CompletionPopup';
import {
  formatDate,
  formatWeekRange,
  getWeekStart,
  getPreviousWeek,
  getNextWeek,
  getToday,
  getTodayString,
} from '../../lib/utils';

export default function WeeklyScreen() {
  const { colors } = useTheme();
  const { weeklyHabits, refresh: refreshHabits, logHabit } = useHabits();
  const {
    weeklyGoals,
    selectedWeekStart,
    isLoading,
    refresh: refreshGoals,
    createWeeklyGoal,
    incrementWeeklyGoal,
    setSelectedWeek,
  } = useWeeklyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [completionPopup, setCompletionPopup] = useState<{
    visible: boolean;
    habitName: string;
    current: number;
    target: number;
  }>({ visible: false, habitName: '', current: 0, target: 0 });

  useEffect(() => {
    const weekStartStr = formatDate(currentWeekStart);
    setSelectedWeek(weekStartStr);
    refreshGoals(weekStartStr);
  }, [currentWeekStart, setSelectedWeek, refreshGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshGoals()]);
    setRefreshing(false);
  }, [refreshHabits, refreshGoals]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(getPreviousWeek(currentWeekStart));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(getNextWeek(currentWeekStart));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(getWeekStart());
  };

  const handleIncrementWeeklyHabit = useCallback(
    async (habitId: string) => {
      const habit = weeklyHabits.find((h) => h.id === habitId);
      if (!habit) return;

      await logHabit(habitId, getTodayString(), true);

      // Show completion popup with updated progress
      const target = habit.weeklyTarget?.target || 0;
      const newCurrent = habit.currentProgress + 1;
      setCompletionPopup({
        visible: true,
        habitName: habit.name,
        current: newCurrent,
        target: target,
      });
    },
    [logHabit, weeklyHabits]
  );

  const handleCreateGoal = useCallback(
    async (goal: Parameters<typeof createWeeklyGoal>[0]) => {
      try {
        await createWeeklyGoal({
          ...goal,
          week_start: formatDate(currentWeekStart),
          current: 0,
          is_archived: false,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to create goal');
      }
    },
    [createWeeklyGoal, currentWeekStart]
  );

  const isThisWeek = formatDate(currentWeekStart) === formatDate(getWeekStart());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Week Navigation */}
      <View style={[styles.weekNav, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToThisWeek} style={styles.weekInfo}>
          <Text style={[styles.weekText, { color: colors.text }]}>
            {formatWeekRange(currentWeekStart)}
          </Text>
          {isThisWeek && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>This Week</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

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
        {/* Weekly Planning Banner */}
        <TouchableOpacity
          style={[styles.planBanner, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => router.push('/plan-week')}
        >
          <View style={styles.planBannerContent}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.planBannerText, { color: colors.text }]}>
              Plan & adjust your weekly targets
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Weekly Habits Section */}
        <SectionHeader title="Weekly Habits" />
        {weeklyHabits.length === 0 ? (
          <EmptyState
            icon="repeat-outline"
            title="No weekly habits"
            message="Add habits you want to track multiple times per week"
          />
        ) : (
          weeklyHabits.map((habit) => (
            <WeeklyHabitCard
              key={habit.id}
              habit={habit}
              onPress={() => router.push(`/habit/${habit.id}`)}
              onIncrement={isThisWeek ? () => handleIncrementWeeklyHabit(habit.id) : undefined}
            />
          ))
        )}

        {/* Weekly Goals Section */}
        <SectionHeader title="Weekly Goals" onAdd={() => setShowAddGoal(true)} />
        {weeklyGoals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No goals this week"
            message="Set goals to achieve by the end of the week"
            actionLabel="Add Weekly Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : (
          weeklyGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              name={goal.name}
              current={goal.current}
              target={goal.target}
              isRecurring={goal.is_recurring}
              onPress={() => router.push(`/goal/${goal.id}?type=weekly`)}
              onIncrement={isThisWeek ? () => incrementWeeklyGoal(goal.id) : undefined}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSubmit={handleCreateGoal}
        type="weekly"
        period={formatDate(currentWeekStart)}
      />

      <CompletionPopup
        visible={completionPopup.visible}
        habitName={completionPopup.habitName}
        current={completionPopup.current}
        target={completionPopup.target}
        onHide={() => setCompletionPopup((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  planBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planBannerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 24,
  },
});
