import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useMonthlyGoals, useYearlyGoals } from '../hooks/useGoals';
import { formatDate, formatMonthYear, getMonthStart, getNextMonth } from '../lib/utils';

export default function PlanMonthScreen() {
  const { colors } = useTheme();
  const { monthlyGoals, createMonthlyGoal } = useMonthlyGoals();
  const { allYearlyGoals } = useYearlyGoals();

  const thisMonth = getMonthStart();
  const nextMonth = getNextMonth(thisMonth);
  const [selectedMonth, setSelectedMonth] = useState<'this' | 'next'>('next');

  const month = selectedMonth === 'this' ? thisMonth : nextMonth;
  const monthStr = formatDate(month);

  // Form state
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    try {
      await createMonthlyGoal({
        name: newGoalName.trim(),
        target: parseInt(newGoalTarget) || 1,
        month: monthStr,
        current: 0,
        is_recurring: isRecurring,
        is_archived: false,
        linked_yearly_goal_id: linkedGoalId,
      });
      setNewGoalName('');
      setNewGoalTarget('1');
      setIsRecurring(false);
      setLinkedGoalId(null);
      Alert.alert('Success', 'Goal added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const selectedGoal = allYearlyGoals.find((g) => g.id === linkedGoalId);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Plan Your Month',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={[
              styles.monthOption,
              {
                backgroundColor:
                  selectedMonth === 'this' ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedMonth('this')}
          >
            <Text
              style={[
                styles.monthOptionText,
                { color: selectedMonth === 'this' ? '#fff' : colors.text },
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.monthOption,
              {
                backgroundColor:
                  selectedMonth === 'next' ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedMonth('next')}
          >
            <Text
              style={[
                styles.monthOptionText,
                { color: selectedMonth === 'next' ? '#fff' : colors.text },
              ]}
            >
              Next Month
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.monthName, { color: colors.textSecondary }]}>
          {formatMonthYear(month)}
        </Text>

        {/* Add Monthly Goal */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Monthly Goal</Text>

          <Text style={[styles.label, { color: colors.text }]}>Goal Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g., Complete 10 workouts"
            placeholderTextColor={colors.textTertiary}
            value={newGoalName}
            onChangeText={setNewGoalName}
          />

          <Text style={[styles.label, { color: colors.text }]}>Target</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g., 10"
            placeholderTextColor={colors.textTertiary}
            value={newGoalTarget}
            onChangeText={setNewGoalTarget}
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Recurring</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Automatically add to next month
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isRecurring ? colors.primary : colors.textTertiary}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Link to Yearly Goal (Optional)</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowGoalPicker(!showGoalPicker)}
          >
            <Text style={{ color: selectedGoal ? colors.text : colors.textTertiary }}>
              {selectedGoal?.name || 'Select a yearly goal'}
            </Text>
            <Ionicons
              name={showGoalPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showGoalPicker && (
            <View style={[styles.goalPicker, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.goalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setLinkedGoalId(null);
                  setShowGoalPicker(false);
                }}
              >
                <Text style={{ color: colors.textSecondary }}>None</Text>
              </TouchableOpacity>
              {allYearlyGoals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setLinkedGoalId(goal.id);
                    setShowGoalPicker(false);
                  }}
                >
                  <Text style={{ color: colors.text }}>{goal.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {goal.current}/{goal.target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddGoal}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Goals */}
        {monthlyGoals.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Goals</Text>
            {monthlyGoals.map((goal) => (
              <View key={goal.id} style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  {goal.is_recurring && (
                    <Ionicons name="repeat" size={14} color={colors.textTertiary} />
                  )}
                </View>
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
  monthSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  monthOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  monthOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  monthName: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 8,
  },
  goalPicker: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  goalOption: {
    padding: 12,
    borderBottomWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
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
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalName: {
    fontSize: 15,
  },
  goalProgress: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 48,
  },
});
