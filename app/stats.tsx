import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useHabits } from '../hooks/useHabits';
import { useYearlyGoals, useMonthlyGoals, useWeeklyGoals } from '../hooks/useGoals';
import { ProgressBar } from '../components/ProgressBar';

export default function StatsScreen() {
  const { colors } = useTheme();
  const { dailyHabits, weeklyHabits } = useHabits();
  const { yearlyGoals } = useYearlyGoals();
  const { monthlyGoals } = useMonthlyGoals();
  const { weeklyGoals } = useWeeklyGoals();

  // Calculate stats
  const totalHabits = dailyHabits.length + weeklyHabits.length;
  const currentStreaks = dailyHabits.map((h) => h.currentStreak);
  const longestCurrentStreak = currentStreaks.length > 0 ? Math.max(...currentStreaks) : 0;
  const longestStreaks = dailyHabits.map((h) => h.longestStreak);
  const allTimeBestStreak = longestStreaks.length > 0 ? Math.max(...longestStreaks) : 0;

  const avgCompletionRate =
    dailyHabits.length > 0
      ? Math.round(
          dailyHabits.reduce((sum, h) => sum + h.completionRate, 0) / dailyHabits.length
        )
      : 0;

  const completedYearlyGoals = yearlyGoals.filter((g) => g.current >= g.target).length;
  const completedMonthlyGoals = monthlyGoals.filter((g) => g.current >= g.target).length;
  const completedWeeklyGoals = weeklyGoals.filter((g) => g.current >= g.target).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Statistics' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Overview */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalHabits}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Habits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.streak }]}>{longestCurrentStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Best</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>{allTimeBestStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>All-Time Best</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{avgCompletionRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Completion</Text>
            </View>
          </View>
        </View>

        {/* Daily Habits */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Habits</Text>
          {dailyHabits.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No daily habits yet
            </Text>
          ) : (
            dailyHabits.map((habit) => (
              <View key={habit.id} style={styles.habitRow}>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                  <View style={styles.habitStats}>
                    <Text style={[styles.habitStat, { color: colors.streak }]}>
                      🔥 {habit.currentStreak}
                    </Text>
                    <Text style={[styles.habitStat, { color: colors.textSecondary }]}>
                      Best: {habit.longestStreak}
                    </Text>
                    <Text style={[styles.habitStat, { color: colors.textSecondary }]}>
                      {habit.completionRate}%
                    </Text>
                  </View>
                </View>
                <View style={styles.habitProgress}>
                  <ProgressBar
                    progress={habit.completionRate / 100}
                    height={6}
                    progressColor={
                      habit.completionRate >= 80
                        ? colors.success
                        : habit.completionRate >= 50
                          ? colors.warning
                          : colors.error
                    }
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Goals Summary */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals Summary</Text>
          <View style={styles.goalsSummary}>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Weekly Goals</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>
                {completedWeeklyGoals}/{weeklyGoals.length} completed
              </Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Monthly Goals</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>
                {completedMonthlyGoals}/{monthlyGoals.length} completed
              </Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Yearly Goals</Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>
                {completedYearlyGoals}/{yearlyGoals.length} completed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  habitRow: {
    marginBottom: 16,
  },
  habitInfo: {
    marginBottom: 8,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  habitStats: {
    flexDirection: 'row',
    gap: 16,
  },
  habitStat: {
    fontSize: 13,
  },
  habitProgress: {
    marginTop: 4,
  },
  goalsSummary: {
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 48,
  },
});
