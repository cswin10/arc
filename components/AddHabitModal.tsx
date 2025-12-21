import React, { useState } from 'react';
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
import { useTheme } from '../hooks/useTheme';
import { useYearlyGoals } from '../hooks/useGoals';
import { formatDate, getToday, getWeekStart } from '../lib/utils';
import type { HabitType, YearlyGoal } from '../types/database';

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
  type: defaultType = 'daily',
}) => {
  const { colors } = useTheme();
  const { allYearlyGoals } = useYearlyGoals();

  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>(defaultType);
  const [startDate, setStartDate] = useState(formatDate(getToday()));
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(true);
  const [weeklyTarget, setWeeklyTarget] = useState('4');
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a habit name');
      return;
    }

    if (type === 'weekly' && (!weeklyTarget || parseInt(weeklyTarget) < 1)) {
      setError('Please enter a valid weekly target');
      return;
    }

    onSubmit({
      name: name.trim(),
      type,
      start_date: startDate,
      linked_yearly_goal_id: linkedGoalId,
      is_recurring: type === 'weekly' ? isRecurring : undefined,
      weekly_target: type === 'weekly' ? parseInt(weeklyTarget) : undefined,
    });

    // Reset form
    setName('');
    setType(defaultType);
    setStartDate(formatDate(getToday()));
    setLinkedGoalId(null);
    setIsRecurring(true);
    setWeeklyTarget('4');
    setError('');
    onClose();
  };

  const selectedGoal = allYearlyGoals.find((g) => g.id === linkedGoalId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>New Habit</Text>
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

            {type === 'weekly' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Weekly Target</Text>
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
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

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
                <View style={[styles.goalPicker, { backgroundColor: colors.backgroundSecondary }]}>
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
                        {goal.current}/{goal.target} ({goal.year})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  goalPicker: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  goalOption: {
    padding: 12,
    borderBottomWidth: 1,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
