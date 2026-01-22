import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
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
import { YEARLY_GOAL_CATEGORIES } from '../../constants/categories';
import type { YearlyGoalCategory, YearlyGoal } from '../../types/database';

export default function YearlyScreen() {
  const { colors, isDark } = useTheme();
  const {
    yearlyGoals,
    isLoading,
    refresh: refreshGoals,
    createYearlyGoal,
    incrementYearlyGoal,
    setSelectedYear,
  } = useYearlyGoals();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [currentYear, setCurrentYear] = useState(getToday().getFullYear());
  // Start with all categories collapsed for faster initial render
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [amountModal, setAmountModal] = useState<{
    visible: boolean;
    goalId: string;
    goalName: string;
    current: number;
  }>({ visible: false, goalId: '', goalName: '', current: 0 });
  const isOpeningModal = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data on mount and year change
  useEffect(() => {
    setDataLoaded(false);
    setSelectedYear(currentYear);
    refreshGoals(currentYear).then(() => {
      setDataLoaded(true);
    });
  }, [currentYear, setSelectedYear, refreshGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGoals(currentYear);
    setRefreshing(false);
  }, [refreshGoals, currentYear]);

  const goToPreviousYear = useCallback(() => {
    Haptics.selectionAsync();
    setCurrentYear((prev) => prev - 1);
  }, []);

  const goToNextYear = useCallback(() => {
    Haptics.selectionAsync();
    setCurrentYear((prev) => prev + 1);
  }, []);

  const goToThisYear = useCallback(() => {
    Haptics.selectionAsync();
    setCurrentYear(getToday().getFullYear());
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const toggleCategory = useCallback((categoryId: string) => {
    Haptics.selectionAsync();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleSearch = useCallback(() => {
    Haptics.selectionAsync();
    setShowSearch(prev => !prev);
    if (showSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  const thisYear = getToday().getFullYear();
  const isThisYear = currentYear === thisYear;

  // Memoize filtered goals based on search
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return yearlyGoals;
    const query = searchQuery.toLowerCase();
    return yearlyGoals.filter(g => g.name.toLowerCase().includes(query));
  }, [yearlyGoals, searchQuery]);

  // Memoize goals grouped by category
  const goalsByCategory = useMemo(() => {
    return YEARLY_GOAL_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = filteredGoals.filter((g) => (g.category || 'other') === category.id);
      return acc;
    }, {} as Record<YearlyGoalCategory, YearlyGoal[]>);
  }, [filteredGoals]);

  // Memoize stats
  const stats = useMemo(() => {
    const totalGoals = yearlyGoals.length;
    const completedGoals = yearlyGoals.filter((g) => g.current >= g.target).length;
    return { totalGoals, completedGoals };
  }, [yearlyGoals]);

  // Memoize categories that have goals
  const categoriesWithGoals = useMemo(() => {
    return YEARLY_GOAL_CATEGORIES.filter(cat => goalsByCategory[cat.id]?.length > 0);
  }, [goalsByCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Year Navigation - Always responsive */}
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

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search goals..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

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
        {stats.totalGoals > 0 && (
          <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalGoals}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{stats.completedGoals}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddGoal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchButton,
              {
                backgroundColor: showSearch ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleSearch}
          >
            <Ionicons name="search" size={20} color={showSearch ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {!dataLoaded && yearlyGoals.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading goals...</Text>
          </View>
        )}

        {/* Goals by Category */}
        {dataLoaded && filteredGoals.length === 0 && !searchQuery ? (
          <EmptyState
            icon="trophy-outline"
            title="No yearly goals yet"
            message="Set ambitious goals for the year ahead"
            actionLabel="Add Yearly Goal"
            onAction={() => setShowAddGoal(true)}
          />
        ) : dataLoaded && filteredGoals.length === 0 && searchQuery ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No goals found for "{searchQuery}"
            </Text>
          </View>
        ) : (
          categoriesWithGoals.map((category) => {
            const categoryGoals = goalsByCategory[category.id];
            // Sort goals: incomplete first (alphabetically), then completed at bottom (alphabetically)
            const sortedCategoryGoals = [...categoryGoals].sort((a, b) => {
              const aComplete = a.current >= a.target;
              const bComplete = b.current >= b.target;
              if (aComplete !== bComplete) return aComplete ? 1 : -1;
              return a.name.localeCompare(b.name);
            });
            const isExpanded = expandedCategories.has(category.id);
            const categoryCompleted = categoryGoals.filter((g) => g.current >= g.target).length;
            // Calculate percentage based on goals completed, not weighted progress
            const categoryPercent = categoryGoals.length > 0 ? Math.round((categoryCompleted / categoryGoals.length) * 100) : 0;

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
                    {sortedCategoryGoals.map((goal) => (
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
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
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  noResultsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
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
