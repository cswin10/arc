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
import { useMonthlyGoals } from '../../hooks/useGoals';
import { GoalCard } from '../../components/GoalCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddGoalModal } from '../../components/AddGoalModal';
import {
  formatDate,
  formatMonthYear,
  getMonthStart,
  getPreviousMonth,
  getNextMonth,
  isLastDayOfMonth,
  getToday,
} from '../../lib/utils';

export default function MonthlyScreen() {
  const { colors } = useTheme();
  const {
    monthlyGoals,
    selectedMonth,
    isLoading,
    refresh: refreshGoals,
    createMonthlyGoal,
    incrementMonthlyGoal,
    setSelectedMonth,
  } = useMonthlyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getMonthStart());

  const showPlanningPrompt = isLastDayOfMonth();

  useEffect(() => {
    const monthStr = formatDate(currentMonth);
    setSelectedMonth(monthStr);
    refreshGoals(monthStr);
  }, [currentMonth, setSelectedMonth, refreshGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGoals();
    setRefreshing(false);
  }, [refreshGoals]);

  const goToPreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const goToNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const goToThisMonth = () => {
    setCurrentMonth(getMonthStart());
  };

  const handleCreateGoal = useCallback(
    async (goal: Parameters<typeof createMonthlyGoal>[0]) => {
      try {
        await createMonthlyGoal({
          ...goal,
          month: formatDate(currentMonth),
          current: 0,
          is_archived: false,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to create goal');
      }
    },
    [createMonthlyGoal, currentMonth]
  );

  const isThisMonth = formatDate(currentMonth) === formatDate(getMonthStart());

  // Calculate stats
  const totalGoals = monthlyGoals.length;
  const completedGoals = monthlyGoals.filter((g) => g.current >= g.target).length;
  const inProgressGoals = monthlyGoals.filter((g) => g.current > 0 && g.current < g.target).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month Navigation */}
      <View style={[styles.monthNav, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToThisMonth} style={styles.monthInfo}>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {formatMonthYear(currentMonth)}
          </Text>
          {isThisMonth && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>This Month</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
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
        {/* Monthly Planning Prompt */}
        {showPlanningPrompt && isThisMonth && (
          <TouchableOpacity
            style={[styles.planBanner, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/plan-month')}
          >
            <View style={styles.planBannerContent}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.planBannerText, { color: colors.primary }]}>
                Plan next month's goals
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Stats Overview */}
        {totalGoals > 0 && (
          <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalGoals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{completedGoals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{inProgressGoals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
            </View>
          </View>
        )}

        {/* Monthly Goals Section */}
        <SectionHeader title="Monthly Goals" onAdd={() => setShowAddGoal(true)} />
        {monthlyGoals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No goals this month"
            message="Set bigger goals to achieve by the end of the month"
            actionLabel="Add Monthly Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : (
          monthlyGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              name={goal.name}
              current={goal.current}
              target={goal.target}
              isRecurring={goal.is_recurring}
              onPress={() => router.push(`/goal/${goal.id}?type=monthly`)}
              onIncrement={isThisMonth ? () => incrementMonthlyGoal(goal.id) : undefined}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSubmit={handleCreateGoal}
        type="monthly"
        period={formatDate(currentMonth)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthNav: {
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
  monthInfo: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 18,
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  bottomPadding: {
    height: 24,
  },
});
