import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHabits } from '../hooks/useHabits';
import { useWeeklyGoals } from '../hooks/useGoals';
import { formatDate, formatWeekRange, getWeekStart, getNextWeek, getToday } from '../lib/utils';

export default function PlanWeekScreen() {
  const { colors } = useTheme();
  const { weeklyHabits, setWeeklyTarget } = useHabits();
  const { weeklyGoals, createWeeklyGoal } = useWeeklyGoals();

  const thisWeekStart = getWeekStart();
  const nextWeekStart = getNextWeek(thisWeekStart);
  const [selectedWeek, setSelectedWeek] = useState<'this' | 'next'>('this');

  const weekStart = selectedWeek === 'this' ? thisWeekStart : nextWeekStart;
  const weekStartStr = formatDate(weekStart);

  // Local state for editing targets
  const [habitTargets, setHabitTargets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    weeklyHabits.forEach((h) => {
      initial[h.id] = h.weeklyTarget?.target?.toString() || '0';
    });
    return initial;
  });

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('1');

  const handleSaveTargets = async () => {
    try {
      for (const habit of weeklyHabits) {
        const target = parseInt(habitTargets[habit.id]) || 0;
        if (target > 0) {
          await setWeeklyTarget(habit.id, weekStartStr, target);
        }
      }
      Alert.alert('Success', 'Weekly targets updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save targets');
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    try {
      await createWeeklyGoal({
        name: newGoalName.trim(),
        target: parseInt(newGoalTarget) || 1,
        week_start: weekStartStr,
        current: 0,
        is_recurring: false,
        is_archived: false,
        linked_yearly_goal_id: null,
      });
      setNewGoalName('');
      setNewGoalTarget('1');
      Alert.alert('Success', 'Goal added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Plan Your Week',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <TouchableOpacity
            style={[
              styles.weekOption,
              {
                backgroundColor:
                  selectedWeek === 'this' ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedWeek('this')}
          >
            <Text
              style={[
                styles.weekOptionText,
                { color: selectedWeek === 'this' ? '#fff' : colors.text },
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.weekOption,
              {
                backgroundColor:
                  selectedWeek === 'next' ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedWeek('next')}
          >
            <Text
              style={[
                styles.weekOptionText,
                { color: selectedWeek === 'next' ? '#fff' : colors.text },
              ]}
            >
              Next Week
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.weekRange, { color: colors.textSecondary }]}>
          {formatWeekRange(weekStart)}
        </Text>

        {/* Weekly Habit Targets */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Habit Targets</Text>
          {weeklyHabits.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No weekly habits yet. Add habits from the Today screen.
            </Text>
          ) : (
            weeklyHabits.map((habit) => (
              <View key={habit.id} style={styles.habitRow}>
                <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                <View style={styles.targetInput}>
                  <TouchableOpacity
                    style={[styles.targetButton, { backgroundColor: colors.backgroundTertiary }]}
                    onPress={() => {
                      const current = parseInt(habitTargets[habit.id]) || 0;
                      if (current > 0) {
                        setHabitTargets({ ...habitTargets, [habit.id]: (current - 1).toString() });
                      }
                    }}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.targetValue,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={habitTargets[habit.id]}
                    onChangeText={(val) => setHabitTargets({ ...habitTargets, [habit.id]: val })}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={[styles.targetButton, { backgroundColor: colors.backgroundTertiary }]}
                    onPress={() => {
                      const current = parseInt(habitTargets[habit.id]) || 0;
                      setHabitTargets({ ...habitTargets, [habit.id]: (current + 1).toString() });
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          {weeklyHabits.length > 0 && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveTargets}
            >
              <Text style={styles.saveButtonText}>Save Targets</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Weekly Goal */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Weekly Goal</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Goal name..."
            placeholderTextColor={colors.textTertiary}
            value={newGoalName}
            onChangeText={setNewGoalName}
          />
          <View style={styles.goalTargetRow}>
            <Text style={[styles.goalTargetLabel, { color: colors.textSecondary }]}>Target:</Text>
            <TextInput
              style={[
                styles.goalTargetInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
              keyboardType="number-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddGoal}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Goals */}
        {weeklyGoals.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week's Goals</Text>
            {weeklyGoals.map((goal) => (
              <View key={goal.id} style={styles.goalRow}>
                <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                <Text style={[styles.goalProgress, { color: colors.textSecondary }]}>
                  {goal.current}/{goal.target}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  weekOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  weekOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  weekRange: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  habitName: {
    fontSize: 15,
    flex: 1,
  },
  targetInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetValue: {
    width: 48,
    height: 36,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  goalTargetLabel: {
    fontSize: 14,
  },
  goalTargetInput: {
    width: 64,
    height: 40,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  goalName: {
    fontSize: 15,
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 48,
  },
});
