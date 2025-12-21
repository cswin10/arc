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
import { useYearlyGoals } from '../../hooks/useGoals';
import { GoalCard } from '../../components/GoalCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AddGoalModal } from '../../components/AddGoalModal';
import { getToday } from '../../lib/utils';

export default function YearlyScreen() {
  const { colors } = useTheme();
  const {
    yearlyGoals,
    selectedYear,
    isLoading,
    refresh: refreshGoals,
    createYearlyGoal,
    incrementYearlyGoal,
    setSelectedYear,
  } = useYearlyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [currentYear, setCurrentYear] = useState(getToday().getFullYear());

  useEffect(() => {
    setSelectedYear(currentYear);
    refreshGoals(currentYear);
  }, [currentYear, setSelectedYear, refreshGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGoals();
    setRefreshing(false);
  }, [refreshGoals]);

  const goToPreviousYear = () => {
    setCurrentYear((prev) => prev - 1);
  };

  const goToNextYear = () => {
    setCurrentYear((prev) => prev + 1);
  };

  const goToThisYear = () => {
    setCurrentYear(getToday().getFullYear());
  };

  const handleCreateGoal = useCallback(
    async (goal: Parameters<typeof createYearlyGoal>[0]) => {
      try {
        await createYearlyGoal({
          ...goal,
          year: currentYear,
          current: 0,
          is_archived: false,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to create goal');
      }
    },
    [createYearlyGoal, currentYear]
  );

  const thisYear = getToday().getFullYear();
  const isThisYear = currentYear === thisYear;

  // Calculate stats
  const totalGoals = yearlyGoals.length;
  const completedGoals = yearlyGoals.filter((g) => g.current >= g.target).length;
  const totalProgress = yearlyGoals.reduce((acc, g) => acc + g.current, 0);
  const totalTarget = yearlyGoals.reduce((acc, g) => acc + g.target, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Year Navigation */}
      <View style={[styles.yearNav, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goToPreviousYear} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToThisYear} style={styles.yearInfo}>
          <Text style={[styles.yearText, { color: colors.text }]}>{currentYear}</Text>
          {isThisYear && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>This Year</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextYear} style={styles.navButton}>
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
        {/* Stats Overview */}
        {totalGoals > 0 && (
          <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.mainStat}>
              <Text style={[styles.mainStatValue, { color: colors.primary }]}>
                {overallProgress}%
              </Text>
              <Text style={[styles.mainStatLabel, { color: colors.textSecondary }]}>
                Overall Progress
              </Text>
            </View>
            <View style={styles.secondaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalGoals}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{completedGoals}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Yearly Goals Section */}
        <SectionHeader title="Yearly Goals" onAdd={() => setShowAddGoal(true)} />
        {yearlyGoals.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="No yearly goals yet"
            message="Set ambitious goals for the year ahead"
            actionLabel="Add Yearly Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : (
          yearlyGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              name={goal.name}
              current={goal.current}
              target={goal.target}
              onPress={() => router.push(`/goal/${goal.id}?type=yearly`)}
              onIncrement={isThisYear ? () => incrementYearlyGoal(goal.id) : undefined}
            />
          ))
        )}

        {/* Tip for new users */}
        {yearlyGoals.length > 0 && yearlyGoals.length < 3 && (
          <View style={[styles.tipContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="bulb-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Tip: Link your weekly and monthly goals to yearly goals to track progress
              automatically.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSubmit={handleCreateGoal}
        type="yearly"
        period={currentYear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  yearNav: {
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
  yearInfo: {
    alignItems: 'center',
    flex: 1,
  },
  yearText: {
    fontSize: 24,
    fontWeight: 'bold',
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
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  mainStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  secondaryStats: {
    flexDirection: 'row',
    gap: 48,
  },
  statItem: {
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
  tipContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 24,
  },
});
