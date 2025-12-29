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
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useHabits } from '../../hooks/useHabits';
import { ProgressBar } from '../../components/ProgressBar';
import { calculateStreak, calculateCompletionRate, formatDate, getToday } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { LIFE_CATEGORIES, getCategoryConfig } from '../../constants/categories';
import type { Habit, HabitLog, StreakFreeze, LifeCategory } from '../../types/database';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { getHabitWithLogs, updateHabit, archiveHabit, deleteHabit, logHabit, addStreakFreeze, removeStreakFreeze } = useHabits();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [freezes, setFreezes] = useState<StreakFreeze[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editCategory, setEditCategory] = useState<LifeCategory>('other');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getHabitWithLogs(id);
    if (data) {
      setHabit(data.habit);
      setLogs(data.logs);
      setFreezes(data.freezes);
      setEditName(data.habit.name);
      setEditStartDate(parseISO(data.habit.start_date));
      setEditCategory(data.habit.category || 'other');
    }
    setIsLoading(false);
  }, [id, getHabitWithLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveEdit = async () => {
    if (!habit || !editName.trim()) return;
    const newStartDate = formatDate(editStartDate);
    await updateHabit(habit.id, { name: editName.trim(), start_date: newStartDate, category: editCategory });
    setHabit({ ...habit, name: editName.trim(), start_date: newStartDate, category: editCategory });
    setIsEditing(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEditStartDate(selectedDate);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive Habit', 'This habit will be moved to your archive. You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          if (habit) {
            await archiveHabit(habit.id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'This will permanently delete this habit and all its logs. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (habit) {
              await deleteHabit(habit.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const toggleFreezeForDate = async (date: string) => {
    if (!habit) return;
    const hasFreezeOnDate = hasFreezeForDate(date);
    if (hasFreezeOnDate) {
      await removeStreakFreeze(habit.id, date);
    } else {
      await addStreakFreeze(habit.id, date);
    }
    await loadData();
  };

  const toggleLogForDate = async (date: string, currentStatus: boolean | undefined) => {
    if (!habit) return;

    if (currentStatus === undefined) {
      // Not logged -> logged as completed
      await logHabit(habit.id, date, true);
    } else if (currentStatus === true) {
      // Completed -> not completed
      await logHabit(habit.id, date, false);
    } else {
      // Not completed -> delete log (not logged)
      // For now, toggle back to completed
      await logHabit(habit.id, date, true);
    }
    await loadData();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Habit not found</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { currentStreak, longestStreak } = calculateStreak(logs, freezes, habit.start_date);
  const completionRate = calculateCompletionRate(logs, habit.start_date);

  // Get last 30 days for calendar
  const today = getToday();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    return formatDate(date);
  });

  const getLogStatus = (date: string): boolean | undefined => {
    const log = logs.find((l) => l.date === date);
    return log?.completed;
  };

  const hasFreezeForDate = (date: string): boolean => {
    return freezes.some((f) => f.date === date);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Habit' : habit.name,
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
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Start Date</Text>
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
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {format(editStartDate, 'd MMMM yyyy')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Life Category</Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryEmoji}>{getCategoryConfig(editCategory).emoji}</Text>
              <Text style={[styles.dateButtonText, { color: colors.text, flex: 1 }]}>
                {getCategoryConfig(editCategory).label}
              </Text>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={[styles.categoryGrid, { backgroundColor: colors.backgroundSecondary }]}>
                {LIFE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: editCategory === cat.id ? cat.color + '20' : 'transparent',
                        borderColor: editCategory === cat.id ? cat.color : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEditCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { color: editCategory === cat.id ? cat.color : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 24 }]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Section */}
            <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.streak }]}>{currentStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Current Streak
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{longestStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{completionRate}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Rate</Text>
              <ProgressBar progress={completionRate / 100} height={12} />
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 30 Days</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Tap to toggle • Long press to freeze
              </Text>
              <View style={styles.calendarGrid}>
                {last30Days.map((date) => {
                  const status = getLogStatus(date);
                  const hasFreezeOnDate = hasFreezeForDate(date);

                  let bgColor = colors.backgroundTertiary;
                  if (status === true) bgColor = colors.success;
                  else if (status === false) bgColor = colors.error;
                  else if (hasFreezeOnDate) bgColor = colors.warning;

                  return (
                    <TouchableOpacity
                      key={date}
                      style={[styles.calendarDay, { backgroundColor: bgColor }]}
                      onPress={() => toggleLogForDate(date, status)}
                      onLongPress={() => toggleFreezeForDate(date)}
                      delayLongPress={500}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: status !== undefined || hasFreezeOnDate ? '#fff' : colors.textTertiary },
                        ]}
                      >
                        {new Date(date).getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Done</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Skipped</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Frozen</Text>
                </View>
              </View>
            </View>

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.categoryInfoRow}>
                  <Text style={styles.categoryInfoEmoji}>{getCategoryConfig(habit.category).emoji}</Text>
                  <Text style={[styles.infoValue, { color: getCategoryConfig(habit.category).color }]}>
                    {getCategoryConfig(habit.category).label}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {habit.type.charAt(0).toUpperCase() + habit.type.slice(1)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Start Date</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(habit.start_date, 'd MMMM yyyy')}</Text>
              </View>
            </View>

            {/* Archive Button */}
            <TouchableOpacity
              style={[styles.archiveButton, { borderColor: colors.textSecondary }]}
              onPress={handleArchive}
            >
              <Ionicons name="archive-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.archiveButtonText, { color: colors.textSecondary }]}>Archive Habit</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.error }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Permanently</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editSection: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  doneButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryGrid: {
    marginTop: 8,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    width: '48%',
  },
  categoryOptionEmoji: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  calendarSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  infoSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  categoryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryInfoEmoji: {
    fontSize: 16,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 48,
  },
});
