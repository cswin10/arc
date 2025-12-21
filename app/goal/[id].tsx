import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useWeeklyGoals, useMonthlyGoals, useYearlyGoals } from '../../hooks/useGoals';
import { ProgressBar } from '../../components/ProgressBar';

export default function GoalDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { colors } = useTheme();

  const {
    weeklyGoals,
    updateWeeklyGoal,
    incrementWeeklyGoal,
    archiveWeeklyGoal,
  } = useWeeklyGoals();
  const {
    monthlyGoals,
    updateMonthlyGoal,
    incrementMonthlyGoal,
    archiveMonthlyGoal,
  } = useMonthlyGoals();
  const {
    yearlyGoals,
    updateYearlyGoal,
    incrementYearlyGoal,
    archiveYearlyGoal,
    getLinkedItems,
  } = useYearlyGoals();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editCurrent, setEditCurrent] = useState('');
  const [linkedItems, setLinkedItems] = useState<{
    habits: any[];
    weeklyGoals: any[];
    monthlyGoals: any[];
  } | null>(null);

  // Find the goal based on type
  const goal =
    type === 'weekly'
      ? weeklyGoals.find((g) => g.id === id)
      : type === 'monthly'
        ? monthlyGoals.find((g) => g.id === id)
        : yearlyGoals.find((g) => g.id === id);

  useEffect(() => {
    if (goal) {
      setEditName(goal.name);
      setEditTarget(goal.target.toString());
      setEditCurrent(goal.current.toString());
    }
  }, [goal]);

  useEffect(() => {
    if (type === 'yearly' && id) {
      getLinkedItems(id).then(setLinkedItems);
    }
  }, [type, id, getLinkedItems]);

  const handleSaveEdit = async () => {
    if (!goal || !editName.trim() || !editTarget) return;

    const updates = {
      name: editName.trim(),
      target: parseInt(editTarget) || 1,
      current: parseInt(editCurrent) || 0,
    };

    if (type === 'weekly') {
      await updateWeeklyGoal(goal.id, updates);
    } else if (type === 'monthly') {
      await updateMonthlyGoal(goal.id, updates);
    } else {
      await updateYearlyGoal(goal.id, updates);
    }
    setIsEditing(false);
  };

  const handleIncrement = async () => {
    if (!goal) return;
    if (type === 'weekly') {
      await incrementWeeklyGoal(goal.id);
    } else if (type === 'monthly') {
      await incrementMonthlyGoal(goal.id);
    } else {
      await incrementYearlyGoal(goal.id);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive Goal', 'This goal will be moved to your archive.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          if (goal) {
            if (type === 'weekly') {
              await archiveWeeklyGoal(goal.id);
            } else if (type === 'monthly') {
              await archiveMonthlyGoal(goal.id);
            } else {
              await archiveYearlyGoal(goal.id);
            }
            router.back();
          }
        },
      },
    ]);
  };

  if (!goal) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progress = goal.target > 0 ? goal.current / goal.target : 0;
  const isComplete = goal.current >= goal.target;
  const progressColor = isComplete ? colors.success : colors.primary;
  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Goal' : goal.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Target</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editTarget}
              onChangeText={setEditTarget}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: colors.text }]}>Current Progress</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editCurrent}
              onChangeText={setEditCurrent}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress Section */}
            <View style={[styles.progressSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
                <View style={styles.progressValues}>
                  <Text style={[styles.currentValue, { color: progressColor }]}>{goal.current}</Text>
                  <Text style={[styles.separator, { color: colors.textTertiary }]}>/</Text>
                  <Text style={[styles.targetValue, { color: colors.textSecondary }]}>
                    {goal.target}
                  </Text>
                </View>
              </View>
              <ProgressBar progress={progress} height={12} progressColor={progressColor} showOverflow />
              {isComplete && (
                <View style={[styles.completeBadge, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.completeText, { color: colors.success }]}>Completed!</Text>
                </View>
              )}
            </View>

            {/* Increment Button */}
            <TouchableOpacity
              style={[styles.incrementButton, { backgroundColor: colors.primary }]}
              onPress={handleIncrement}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.incrementButtonText}>Add Progress</Text>
            </TouchableOpacity>

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{typeLabel} Goal</Text>
              </View>
              {'is_recurring' in goal && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Recurring</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {goal.is_recurring ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Percentage</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>

            {/* Linked Items for Yearly Goals */}
            {type === 'yearly' && linkedItems && (
              <View style={styles.linkedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Linked Items</Text>
                {linkedItems.habits.length === 0 &&
                linkedItems.weeklyGoals.length === 0 &&
                linkedItems.monthlyGoals.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No items linked to this goal yet
                  </Text>
                ) : (
                  <>
                    {linkedItems.habits.map((habit) => (
                      <TouchableOpacity
                        key={habit.id}
                        style={[styles.linkedItem, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => router.push(`/habit/${habit.id}`)}
                      >
                        <Ionicons
                          name={habit.type === 'daily' ? 'today-outline' : 'repeat-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={[styles.linkedItemText, { color: colors.text }]}>
                          {habit.name}
                        </Text>
                        <Text style={[styles.linkedItemType, { color: colors.textTertiary }]}>
                          {habit.type} habit
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {linkedItems.weeklyGoals.map((g) => (
                      <View
                        key={g.id}
                        style={[styles.linkedItem, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.linkedItemText, { color: colors.text }]}>{g.name}</Text>
                        <Text style={[styles.linkedItemType, { color: colors.textTertiary }]}>
                          weekly goal
                        </Text>
                      </View>
                    ))}
                    {linkedItems.monthlyGoals.map((g) => (
                      <View
                        key={g.id}
                        style={[styles.linkedItem, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                        <Text style={[styles.linkedItemText, { color: colors.text }]}>{g.name}</Text>
                        <Text style={[styles.linkedItemType, { color: colors.textTertiary }]}>
                          monthly goal
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Archive Button */}
            <TouchableOpacity
              style={[styles.archiveButton, { borderColor: colors.error }]}
              onPress={handleArchive}
            >
              <Ionicons name="archive-outline" size={20} color={colors.error} />
              <Text style={[styles.archiveButtonText, { color: colors.error }]}>Archive Goal</Text>
            </TouchableOpacity>
          </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSection: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  targetValue: {
    fontSize: 20,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  incrementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  incrementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkedSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  linkedItemText: {
    flex: 1,
    fontSize: 15,
  },
  linkedItemType: {
    fontSize: 12,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 48,
  },
});
