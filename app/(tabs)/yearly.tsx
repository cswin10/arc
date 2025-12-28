import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useYearlyGoals } from '../../hooks/useGoals';
import { GoalCard } from '../../components/GoalCard';
import { EmptyState } from '../../components/EmptyState';
import { AddGoalModal } from '../../components/AddGoalModal';
import { AmountInputModal } from '../../components/AmountInputModal';
import { getToday } from '../../lib/utils';
import { YEARLY_GOAL_CATEGORIES, getCategoryConfig } from '../../constants/categories';
import type { YearlyGoalCategory, YearlyGoal } from '../../types/database';

export default function YearlyScreen() {
  const { colors, isDark } = useTheme();
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(YEARLY_GOAL_CATEGORIES.map(c => c.id)));
  const [amountModal, setAmountModal] = useState<{
    visible: boolean;
    goalId: string;
    goalName: string;
    current: number;
  }>({ visible: false, goalId: '', goalName: '', current: 0 });
  const isOpeningModal = useRef(false);

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
    Haptics.selectionAsync();
    setCurrentYear((prev) => prev - 1);
  };

  const goToNextYear = () => {
    Haptics.selectionAsync();
    setCurrentYear((prev) => prev + 1);
  };

  const goToThisYear = () => {
    Haptics.selectionAsync();
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

  const handleOpenAmountModal = useCallback((goal: YearlyGoal) => {
    if (isOpeningModal.current) return;
    isOpeningModal.current = true;
    setAmountModal({
      visible: true,
      goalId: goal.id,
      goalName: goal.name,
      current: goal.current,
    });
    setTimeout(() => {
      isOpeningModal.current = false;
    }, 300);
  }, []);

  const handleIncrementGoal = useCallback(
    async (amount: number) => {
      await incrementYearlyGoal(amountModal.goalId, amount);
    },
    [incrementYearlyGoal, amountModal.goalId]
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const thisYear = getToday().getFullYear();
  const isThisYear = currentYear === thisYear;

  // Group goals by category
  const goalsByCategory = YEARLY_GOAL_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = yearlyGoals.filter((g) => (g.category || 'other') === category.id);
    return acc;
  }, {} as Record<YearlyGoalCategory, YearlyGoal[]>);

  // Calculate stats
  const totalGoals = yearlyGoals.length;
  const completedGoals = yearlyGoals.filter((g) => g.current >= g.target).length;

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
            <View style={[styles.currentBadge, { backgroundColor: isDark ? 'rgba(224, 64, 251, 0.2)' : 'rgba(224, 64, 251, 0.15)' }]}>
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
          <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.statsRow}>
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

        {/* Add Goal Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddGoal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Yearly Goal</Text>
        </TouchableOpacity>

        {/* Goals by Category */}
        {yearlyGoals.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="No yearly goals yet"
            message="Set ambitious goals for the year ahead"
            actionLabel="Add Yearly Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : (
          YEARLY_GOAL_CATEGORIES.map((category) => {
            const categoryGoals = goalsByCategory[category.id];
            if (categoryGoals.length === 0) return null;

            const isExpanded = expandedCategories.has(category.id);
            const categoryCompleted = categoryGoals.filter((g) => g.current >= g.target).length;
            const categoryProgress = categoryGoals.reduce((acc, g) => acc + Math.min(g.current, g.target), 0);
            const categoryTarget = categoryGoals.reduce((acc, g) => acc + g.target, 0);
            const categoryPercent = categoryTarget > 0 ? Math.round((categoryProgress / categoryTarget) * 100) : 0;

            return (
              <View key={category.id} style={styles.categorySection}>
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderColor: category.color + '40',
                    },
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View>
                      <Text style={[styles.categoryTitle, { color: colors.text }]}>
                        {category.label}
                      </Text>
                      <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>
                        {categoryCompleted}/{categoryGoals.length} completed · {categoryPercent}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <View style={[styles.categoryProgressBg, { backgroundColor: colors.backgroundTertiary }]}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          { width: `${categoryPercent}%`, backgroundColor: category.color }
                        ]}
                      />
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.categoryGoals}>
                    {categoryGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        name={goal.name}
                        current={goal.current}
                        target={goal.target}
                        onPress={() => router.push(`/goal/${goal.id}?type=yearly`)}
                        onIncrement={isThisYear ? () => handleOpenAmountModal(goal) : undefined}
                        accentColor={category.color}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
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

      <AmountInputModal
        visible={amountModal.visible}
        habitName={amountModal.goalName}
        currentDayAmount={amountModal.current}
        onClose={() => setAmountModal((prev) => ({ ...prev, visible: false }))}
        onSubmit={handleIncrementGoal}
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
    fontSize: 28,
    fontWeight: '800',
  },
  currentBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#E040FB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#E040FB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginTop: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  categorySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryProgressBg: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryGoals: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
