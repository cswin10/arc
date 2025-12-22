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
import { formatDate, getWeekStart, getMonthStart, getToday } from '../lib/utils';
import { YEARLY_GOAL_CATEGORIES, getCategoryConfig } from '../constants/categories';
import type { YearlyGoalCategory } from '../types/database';

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
    category?: YearlyGoalCategory;
  }) => void;
  type: GoalType;
  period?: string | number;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
  type,
  period,
}) => {
  const { colors, isDark } = useTheme();
  const { allYearlyGoals } = useYearlyGoals();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<YearlyGoalCategory>('other');
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

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    if (!target || parseInt(target) < 1) {
      setError('Please enter a valid target');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
        category: selectedCategory,
      });
    }

    // Reset form
    setName('');
    setTarget('1');
    setIsRecurring(false);
    setLinkedGoalId(null);
    setSelectedCategory('other');
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
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.cardBorder,
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
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder="e.g., 10"
                placeholderTextColor={colors.textTertiary}
                value={target}
                onChangeText={setTarget}
                keyboardType="number-pad"
              />
            </View>

            {/* Category picker for yearly goals */}
            {type === 'yearly' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {YEARLY_GOAL_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected
                              ? category.color + '20'
                              : colors.cardBackground,
                            borderColor: isSelected ? category.color : colors.cardBorder,
                          },
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
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
              </View>
            )}

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
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
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
                    <View style={[styles.goalPicker, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                      <ScrollView style={styles.goalPickerScroll} nestedScrollEnabled>
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
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={styles.bottomPadding} />
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
    fontWeight: '700',
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
    fontWeight: '600',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
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
  goalPickerScroll: {
    flex: 1,
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
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 40,
  },
});
