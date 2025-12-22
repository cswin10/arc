import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { ProgressBar } from './ProgressBar';
import { getWeekDays, formatDate } from '../lib/utils';
import type { WeeklyHabitWithProgress } from '../types/database';

interface WeeklyHabitCardProps {
  habit: WeeklyHabitWithProgress;
  onPress?: () => void;
  onIncrement?: () => void;
}

export const WeeklyHabitCard: React.FC<WeeklyHabitCardProps> = ({
  habit,
  onPress,
  onIncrement,
}) => {
  const { colors, isDark } = useTheme();

  const target = habit.weeklyTarget?.target || 0;
  const current = habit.currentProgress;
  const progress = target > 0 ? current / target : 0;
  const isComplete = current >= target;
  const progressColor = isComplete ? colors.success : colors.primary;

  // Get week days and log status for each day
  const weekDays = useMemo(() => {
    const days = getWeekDays();
    return days.map((date) => {
      const dateStr = formatDate(date);
      const log = habit.logs?.find((l) => l.date === dateStr);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'narrow' });
      return {
        date: dateStr,
        dayLabel,
        status: log ? (log.completed ? 'done' : 'skipped') : 'pending',
      };
    });
  }, [habit.logs]);

  const handleIncrement = async () => {
    if (onIncrement) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onIncrement();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {current}/{target}
            </Text>
          </View>

          {/* Week progress circles */}
          <View style={styles.weekDots}>
            {weekDays.map((day) => (
              <View key={day.date} style={styles.dayContainer}>
                <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>
                  {day.dayLabel}
                </Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor:
                        day.status === 'done'
                          ? colors.success
                          : day.status === 'skipped'
                          ? colors.error
                          : colors.backgroundTertiary,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Increment button - positioned to avoid overlap */}
        {onIncrement && (
          <TouchableOpacity
            style={[
              styles.incrementButton,
              {
                backgroundColor: isDark
                  ? progressColor + '25'
                  : progressColor + '15',
                borderColor: progressColor + '50',
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleIncrement();
            }}
          >
            <Ionicons name="add" size={20} color={progressColor} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
