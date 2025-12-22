import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useYearlyGoals } from '../hooks/useGoals';
import { formatDate, getToday, getWeekStart, formatShortDate } from '../lib/utils';
import { YEARLY_GOAL_CATEGORIES, getCategoryConfig } from '../constants/categories';
import { DatePickerModal } from './DatePickerModal';
import type { HabitType, YearlyGoal, YearlyGoalCategory } from '../types/database';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (habit: {
    name: string;
    type: HabitType;
    start_date: string;
    linked_yearly_goal_id: string | null;
    is_recurring?: boolean;
    weekly_target?: number;
  }) => void;
  type?: HabitType;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onSubmit,
  type: fixedType,
}) => {
  const { colors, isDark } = useTheme();
  const { allYearlyGoals } = useYearlyGoals();

  const [name, setName] = useState('');
  // Use fixedType if provided, otherwise default to 'daily'
  const [type, setType] = useState<HabitType>(fixedType || 'daily');
  const [startDate, setStartDate] = useState(formatDate(getToday()));
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(true);
  const [weeklyTarget, setWeeklyTarget] = useState('4');
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  // Group yearly goals by category
  const goalsByCategory = useMemo(() => {
    return YEARLY_GOAL_CATEGORIES.reduce((acc, category) => {
      const goals = allYearlyGoals.filter((g) => (g.category || 'other') === category.id);
      if (goals.length > 0) {
        acc[category.id] = goals;
      }
      return acc;
    }, {} as Record<YearlyGoalCategory, typeof allYearlyGoals>);
  }, [allYearlyGoals]);

  // Use the effective type (fixed or selected)
  const effectiveType = fixedType || type;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a habit name');
      return;
    }

    if (effectiveType === 'weekly' && (!weeklyTarget || parseInt(weeklyTarget) < 1)) {
      setError('Please enter a valid weekly target');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    onSubmit({
      name: name.trim(),
      type: effectiveType,
      start_date: startDate,
      linked_yearly_goal_id: linkedGoalId,
      is_recurring: effectiveType === 'weekly' ? isRecurring : undefined,
      weekly_target: effectiveType === 'weekly' ? parseInt(weeklyTarget) : undefined,
    });

    // Reset form
    setName('');
    setType(fixedType || 'daily');
    setStartDate(formatDate(getToday()));
    setLinkedGoalId(null);
    setIsRecurring(true);
    setWeeklyTarget('4');
    setError('');
    onClose();
  };

  const selectedGoal = allYearlyGoals.find((g) => g.id === linkedGoalId);
  const typeLabel = effectiveType === 'weekly' ? 'Weekly' : 'Daily';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>New {typeLabel} Habit</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Habit Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Exercise, Read, Meditate"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            {/* Only show type toggle if no fixed type is provided */}
            {!fixedType && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor:
                          type === 'daily' ? colors.primary : colors.backgroundSecondary,
                        borderColor: type === 'daily' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setType('daily')}
                  >
                    <Text
                      style={[styles.typeButtonText, { color: type === 'daily' ? '#fff' : colors.text }]}
                    >
                      Daily
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor:
                          type === 'weekly' ? colors.primary : colors.backgroundSecondary,
                        borderColor: type === 'weekly' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setType('weekly')}
                  >
                    <Text
                      style={[styles.typeButtonText, { color: type === 'weekly' ? '#fff' : colors.text }]}
                    >
                      Weekly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {effectiveType === 'weekly' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Minimum Weekly Target</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="e.g., 4"
                    placeholderTextColor={colors.textTertiary}
                    value={weeklyTarget}
                    onChangeText={setWeeklyTarget}
                    keyboardType="number-pad"
                  />
                  <Text style={[styles.sublabel, { color: colors.textSecondary, marginTop: 4 }]}>
                    You can always log more than your target
                  </Text>
                </View>

                <View style={styles.switchRow}>
                  <View>
                    <Text style={[styles.label, { color: colors.text }]}>Recurring</Text>
                    <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                      Automatically add to next week
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={isRecurring ? colors.primary : colors.textTertiary}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.text }]}>{formatShortDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <DatePickerModal
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSelect={setStartDate}
              selectedDate={startDate}
              title="Start Date"
            />

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Link to Yearly Goal (Optional)</Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowGoalPicker(!showGoalPicker)}
              >
                <View style={styles.pickerContent}>
                  {selectedGoal ? (
                    <>
                      <Text style={styles.pickerEmoji}>
                        {getCategoryConfig(selectedGoal.category || 'other').emoji}
                      </Text>
                      <Text style={[styles.pickerText, { color: colors.text }]} numberOfLines={1}>
                        {selectedGoal.name}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.pickerText, { color: colors.textTertiary }]}>
                      Select a yearly goal
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={showGoalPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
              {showGoalPicker && (
                <ScrollView style={[styles.goalPicker, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]} nestedScrollEnabled>
                  <TouchableOpacity
                    style={[styles.goalOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setLinkedGoalId(null);
                      setShowGoalPicker(false);
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>None</Text>
                  </TouchableOpacity>

                  {/* Goals organized by category */}
                  {YEARLY_GOAL_CATEGORIES.map((category) => {
                    const goals = goalsByCategory[category.id];
                    if (!goals || goals.length === 0) return null;

                    return (
                      <View key={category.id}>
                        <View style={[styles.categoryHeader, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                          <Text style={styles.categoryHeaderEmoji}>{category.emoji}</Text>
                          <Text style={[styles.categoryHeaderText, { color: colors.textSecondary }]}>
                            {category.label}
                          </Text>
                        </View>
                        {goals.map((goal) => (
                          <TouchableOpacity
                            key={goal.id}
                            style={[
                              styles.goalOption,
                              { borderBottomColor: colors.border },
                              linkedGoalId === goal.id && { backgroundColor: colors.primaryLight + '20' },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setLinkedGoalId(goal.id);
                              setShowGoalPicker(false);
                            }}
                          >
                            <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>
                              {goal.name}
                            </Text>
                            <Text style={[styles.goalProgress, { color: colors.textSecondary }]}>
                              {goal.current}/{goal.target}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerButton: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  pickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerEmoji: {
    fontSize: 16,
  },
  pickerText: {
    fontSize: 15,
    flex: 1,
  },
  goalPicker: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    maxHeight: 300,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  categoryHeaderEmoji: {
    fontSize: 14,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  goalName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  goalProgress: {
    fontSize: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  dateButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
