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
import { formatDate, getWeekStart, getMonthStart, getToday } from '../lib/utils';

type GoalType = 'weekly' | 'monthly' | 'yearly';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (goal: {
    name: string;
    target: number;
    is_recurring?: boolean;
    linked_yearly_goal_id?: string | null;
    week_start?: string;
    month?: string;
    year?: number;
  }) => void;
  type: GoalType;
  period?: string | number; // week_start, month, or year
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
  type,
  period,
}) => {
  const { colors } = useTheme();
  const { allYearlyGoals } = useYearlyGoals();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    if (!target || parseInt(target) < 1) {
      setError('Please enter a valid target');
      return;
    }

    const baseGoal = {
      name: name.trim(),
      target: parseInt(target),
      is_recurring: type !== 'yearly' ? isRecurring : undefined,
      linked_yearly_goal_id: type !== 'yearly' ? linkedGoalId : undefined,
    };

    if (type === 'weekly') {
      onSubmit({
        ...baseGoal,
        week_start: (period as string) || formatDate(getWeekStart()),
      });
    } else if (type === 'monthly') {
      onSubmit({
        ...baseGoal,
        month: (period as string) || formatDate(getMonthStart()),
      });
    } else {
      onSubmit({
        ...baseGoal,
        year: (period as number) || getToday().getFullYear(),
      });
    }

    // Reset form
    setName('');
    setTarget('1');
    setIsRecurring(false);
    setLinkedGoalId(null);
    setError('');
    onClose();
  };

  const selectedGoal = allYearlyGoals.find((g) => g.id === linkedGoalId);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

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
            <Text style={[styles.title, { color: colors.text }]}>New {typeLabel} Goal</Text>
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
                placeholder={`e.g., ${type === 'yearly' ? 'Read 24 books' : 'Complete project milestone'}`}
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
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
                placeholder="e.g., 10"
                placeholderTextColor={colors.textTertiary}
                value={target}
                onChangeText={setTarget}
                keyboardType="number-pad"
              />
            </View>

            {type !== 'yearly' && (
              <>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={[styles.label, { color: colors.text }]}>Recurring</Text>
                    <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                      Automatically add to next {type === 'weekly' ? 'week' : 'month'}
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={isRecurring ? colors.primary : colors.textTertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Link to Yearly Goal (Optional)
                  </Text>
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
              </>
            )}
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
