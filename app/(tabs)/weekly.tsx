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
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useWeeklyGoals } from '../../hooks/useGoals';
import { GoalCard } from '../../components/GoalCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddGoalModal } from '../../components/AddGoalModal';
import { AmountInputModal } from '../../components/AmountInputModal';
import {
  formatDate,
  formatWeekRange,
  getWeekStart,
  getPreviousWeek,
  getNextWeek,
} from '../../lib/utils';

export default function WeeklyScreen() {
  const { colors } = useTheme();
  const {
    weeklyGoals,
    isLoading,
    refresh: refreshGoals,
    createWeeklyGoal,
    incrementWeeklyGoal,
    setSelectedWeek,
  } = useWeeklyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [goalAmountModal, setGoalAmountModal] = useState<{
    visible: boolean;
    goalId: string;
    goalName: string;
    current: number;
  }>({ visible: false, goalId: '', goalName: '', current: 0 });

  useEffect(() => {
    const weekStartStr = formatDate(currentWeekStart);
    setSelectedWeek(weekStartStr);
    refreshGoals(weekStartStr);
  }, [currentWeekStart, setSelectedWeek, refreshGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGoals();
    setRefreshing(false);
  }, [refreshGoals]);

  const goToPreviousWeek = () => {
    Haptics.selectionAsync();
    setCurrentWeekStart(getPreviousWeek(currentWeekStart));
  };

  const goToNextWeek = () => {
    Haptics.selectionAsync();
    setCurrentWeekStart(getNextWeek(currentWeekStart));
  };

  const goToThisWeek = () => {
    Haptics.selectionAsync();
    setCurrentWeekStart(getWeekStart());
  };

  const handleCreateGoal = useCallback(
    async (goal: Parameters<typeof createWeeklyGoal>[0]) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleOpenGoalAmountModal = useCallback((goal: typeof weeklyGoals[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoalAmountModal({
      visible: true,
      goalId: goal.id,
      goalName: goal.name,
      current: goal.current,
    });
  }, []);

  const handleIncrementGoal = useCallback(
    async (amount: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await incrementWeeklyGoal(goalAmountModal.goalId, amount);
    },
    [incrementWeeklyGoal, goalAmountModal.goalId]
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
            <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.currentBadgeText, { color: '#fff' }]}>This Week</Text>
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
              priority={goal.priority}
              onPress={() => router.push(`/goal/${goal.id}?type=weekly`)}
              onIncrement={isThisWeek ? () => handleOpenGoalAmountModal(goal) : undefined}
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
    paddingTop: 16,
  },
  bottomPadding: {
    height: 24,
  },
});
