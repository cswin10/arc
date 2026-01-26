import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useWeeklyGoals, useMonthlyGoals, useYearlyGoals } from '../../hooks/useGoals';
import { useAuth } from '../../hooks/useAuth';
import { ProgressBar } from '../../components/ProgressBar';
import { Toast } from '../../components/Toast';
import { AmountInputModal } from '../../components/AmountInputModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { formatDate, getToday } from '../../lib/utils';
import { YEARLY_GOAL_CATEGORIES } from '../../constants/categories';
import * as db from '../../lib/database';
import type { WeeklyGoalDailyLog, GoalPriority, YearlyGoalCategory } from '../../types/database';

export default function GoalDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const {
    weeklyGoals,
    updateWeeklyGoal,
    incrementWeeklyGoal,
    archiveWeeklyGoal,
    refresh: refreshWeeklyGoals,
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
  const [editPriority, setEditPriority] = useState<GoalPriority>(2);
  const [editRecurring, setEditRecurring] = useState(false);
  const [editTrackDaily, setEditTrackDaily] = useState(false);
  const [editCategory, setEditCategory] = useState<YearlyGoalCategory>('other');
  const [linkedItems, setLinkedItems] = useState<{
    habits: any[];
    weeklyGoals: any[];
    monthlyGoals: any[];
  } | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Daily tracking state
  const [dailyLogs, setDailyLogs] = useState<WeeklyGoalDailyLog[]>([]);
  const [amountModal, setAmountModal] = useState<{
    visible: boolean;
    date: string;
    currentAmount: number;
  }>({ visible: false, date: '', currentAmount: 0 });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

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
      // Set type-specific fields
      if ('priority' in goal) setEditPriority(goal.priority ?? 2);
      if ('is_recurring' in goal) setEditRecurring(goal.is_recurring);
      if ('track_daily' in goal) setEditTrackDaily(goal.track_daily ?? false);
      if ('category' in goal) setEditCategory(goal.category ?? 'other');
    }
  }, [goal]);

  useEffect(() => {
    if (type === 'yearly' && id) {
      getLinkedItems(id).then(setLinkedItems);
    }
  }, [type, id, getLinkedItems]);

  // Load daily logs for weekly goals with track_daily
  const loadDailyLogs = useCallback(async () => {
    if (type === 'weekly' && id) {
      const weeklyGoal = weeklyGoals.find((g) => g.id === id);
      if (weeklyGoal?.track_daily) {
        try {
          const logs = await db.getWeeklyGoalDailyLogs(id);
          setDailyLogs(logs);
        } catch (error) {
          console.error('Failed to load daily logs:', error);
        }
      }
    }
  }, [type, id, weeklyGoals]);

  useEffect(() => {
    loadDailyLogs();
  }, [loadDailyLogs]);

  const handleDayPress = useCallback((date: string) => {
    const existingLog = dailyLogs.find((log) => log.date === date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmountModal({
      visible: true,
      date,
      currentAmount: existingLog?.amount || 0,
    });
  }, [dailyLogs]);

  const handleDailyLogSubmit = useCallback(async (amount: number) => {
    if (!user || !id) return;
    try {
      if (amount === 0) {
        // Delete the log if amount is 0
        await db.deleteWeeklyGoalDailyLog(id, amountModal.date);
      } else {
        await db.logWeeklyGoalDaily(id, user.id, amountModal.date, amount);
      }
      // Recalculate the total
      await db.recalculateWeeklyGoalFromLogs(id);
      await loadDailyLogs();
      await refreshWeeklyGoals();
      setToast({ visible: true, message: 'Progress updated!', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to update progress', type: 'error' });
    }
  }, [user, id, amountModal.date, loadDailyLogs, refreshWeeklyGoals]);

  const handleEditPress = () => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setTimeout(() => {
      setIsEditing(!isEditing);
    }, 100);
  };

  const handleSaveEdit = async () => {
    if (!goal || !editName.trim() || !editTarget) return;

    Keyboard.dismiss();

    const baseUpdates = {
      name: editName.trim(),
      target: parseInt(editTarget) || 1,
      current: parseInt(editCurrent) || 0,
    };

    try {
      if (type === 'weekly') {
        await updateWeeklyGoal(goal.id, {
          ...baseUpdates,
          priority: editPriority,
          is_recurring: editRecurring,
          track_daily: editTrackDaily,
        });
      } else if (type === 'monthly') {
        await updateMonthlyGoal(goal.id, {
          ...baseUpdates,
          priority: editPriority,
          is_recurring: editRecurring,
        });
      } else {
        await updateYearlyGoal(goal.id, {
          ...baseUpdates,
          category: editCategory,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      setToast({ visible: true, message: 'Goal updated successfully!', type: 'success' });
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({ visible: true, message: 'Failed to update goal', type: 'error' });
    }
  };

  const handleIncrement = async () => {
    if (!goal) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === 'weekly') {
      await incrementWeeklyGoal(goal.id);
    } else if (type === 'monthly') {
      await incrementMonthlyGoal(goal.id);
    } else {
      await incrementYearlyGoal(goal.id);
    }
  };

  const handleArchive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowArchiveConfirm(true);
  };

  const handleConfirmArchive = async () => {
    setShowArchiveConfirm(false);
    if (goal) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (type === 'weekly') {
        await archiveWeeklyGoal(goal.id);
      } else if (type === 'monthly') {
        await archiveMonthlyGoal(goal.id);
      } else {
        await archiveYearlyGoal(goal.id);
      }
      router.back();
    }
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
            <TouchableOpacity onPress={handleEditPress} style={styles.headerButton}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Goal Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter goal name"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Target</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={editTarget}
              onChangeText={setEditTarget}
              keyboardType="number-pad"
              placeholder="Enter target"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Progress</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={editCurrent}
              onChangeText={setEditCurrent}
              keyboardType="number-pad"
              placeholder="Enter current progress"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Priority for Weekly/Monthly goals */}
            {(type === 'weekly' || type === 'monthly') && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
                <View style={styles.priorityRow}>
                  {[
                    { value: 1 as GoalPriority, label: 'High', color: '#FF5252' },
                    { value: 2 as GoalPriority, label: 'Medium', color: '#FFB74D' },
                    { value: 3 as GoalPriority, label: 'Low', color: '#4CAF50' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: editPriority === option.value
                            ? option.color + '20'
                            : colors.cardBackground,
                          borderColor: editPriority === option.value ? option.color : colors.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setEditPriority(option.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          { color: editPriority === option.value ? option.color : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Recurring toggle for Weekly/Monthly goals */}
            {(type === 'weekly' || type === 'monthly') && (
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Recurring</Text>
                  <Text style={[styles.switchSublabel, { color: colors.textSecondary }]}>
                    Auto-add to next {type === 'weekly' ? 'week' : 'month'}
                  </Text>
                </View>
                <Switch
                  value={editRecurring}
                  onValueChange={setEditRecurring}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={editRecurring ? colors.primary : colors.textTertiary}
                />
              </View>
            )}

            {/* Track Daily toggle for Weekly goals only */}
            {type === 'weekly' && (
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Track Daily</Text>
                  <Text style={[styles.switchSublabel, { color: colors.textSecondary }]}>
                    Log progress for each day on a calendar
                  </Text>
                </View>
                <Switch
                  value={editTrackDaily}
                  onValueChange={setEditTrackDaily}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={editTrackDaily ? colors.primary : colors.textTertiary}
                />
              </View>
            )}

            {/* Category picker for Yearly goals */}
            {type === 'yearly' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {YEARLY_GOAL_CATEGORIES.map((category) => {
                    const isSelected = editCategory === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected ? category.color + '20' : colors.cardBackground,
                            borderColor: isSelected ? category.color : colors.cardBorder,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditCategory(category.id);
                        }}
                      >
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        <Text
                          style={[
                            styles.categoryLabel,
                            { color: isSelected ? category.color : colors.text },
                          ]}
                        >
                          {category.label.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveEdit}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress Section */}
            <View style={[styles.progressSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
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

            {/* Increment Button - Hide if track_daily is enabled */}
            {!(type === 'weekly' && 'track_daily' in goal && goal.track_daily) && (
              <TouchableOpacity
                style={[styles.incrementButton, { backgroundColor: colors.primary }]}
                onPress={handleIncrement}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.incrementButtonText}>Add Progress</Text>
              </TouchableOpacity>
            )}

            {/* Daily Calendar for Weekly Goals with track_daily */}
            {type === 'weekly' && 'track_daily' in goal && goal.track_daily && 'week_start' in goal && (
              <View style={[styles.calendarSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Progress</Text>
                <Text style={[styles.calendarSubtitle, { color: colors.textSecondary }]}>
                  Tap a day to log progress
                </Text>
                <View style={styles.calendarGrid}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(goal.week_start);
                    date.setDate(date.getDate() + i);
                    const dateStr = formatDate(date);
                    const log = dailyLogs.find((l) => l.date === dateStr);
                    const dayAmount = log?.amount || 0;
                    const isToday = dateStr === formatDate(getToday());
                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.calendarDay,
                          {
                            backgroundColor: dayAmount > 0
                              ? colors.success + '20'
                              : colors.backgroundTertiary,
                            borderColor: isToday ? colors.primary : 'transparent',
                            borderWidth: isToday ? 2 : 0,
                          },
                        ]}
                        onPress={() => handleDayPress(dateStr)}
                      >
                        <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                          {dayNames[i]}
                        </Text>
                        <Text style={[styles.dayNumber, { color: colors.text }]}>
                          {date.getDate()}
                        </Text>
                        {dayAmount > 0 && (
                          <Text style={[styles.dayAmount, { color: colors.success }]}>
                            +{dayAmount}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
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
                        style={[styles.linkedItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push(`/habit/${habit.id}`);
                        }}
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
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.linkedItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push(`/goal/${g.id}?type=weekly`);
                        }}
                      >
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.linkedItemText, { color: colors.text }]}>{g.name}</Text>
                        <Text style={[styles.linkedItemType, { color: colors.textTertiary }]}>
                          weekly goal
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {linkedItems.monthlyGoals.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.linkedItem, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push(`/goal/${g.id}?type=monthly`);
                        }}
                      >
                        <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                        <Text style={[styles.linkedItemText, { color: colors.text }]}>{g.name}</Text>
                        <Text style={[styles.linkedItemType, { color: colors.textTertiary }]}>
                          monthly goal
                        </Text>
                      </TouchableOpacity>
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <AmountInputModal
        visible={amountModal.visible}
        habitName={`Progress for ${amountModal.date}`}
        currentDayAmount={amountModal.currentAmount}
        onClose={() => setAmountModal((prev) => ({ ...prev, visible: false }))}
        onSubmit={handleDailyLogSubmit}
        mode="set"
      />

      <ConfirmationModal
        visible={showArchiveConfirm}
        title="Archive Goal"
        message={`Are you sure you want to archive "${goal?.name}"? You can restore it later from the archives.`}
        confirmText="Archive"
        cancelText="Cancel"
        icon="archive-outline"
        onConfirm={handleConfirmArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />
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
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editSection: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  targetValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
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
    borderRadius: 12,
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
  incrementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkedSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  linkedItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
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
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  calendarSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayAmount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomPadding: {
    height: 48,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryScroll: {
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 10,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
