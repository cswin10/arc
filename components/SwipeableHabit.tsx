import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { getCategoryConfig } from '../constants/categories';
import type { HabitWithStats } from '../types/database';

interface SwipeableHabitProps {
  habit: HabitWithStats;
  onSwipeRight: (habitId: string) => void;
  onSwipeLeft: (habitId: string) => void;
  onPress?: (habitId: string) => void;
  onFreeze?: (habitId: string) => void;
  onUnfreeze?: (habitId: string) => void;
  onClearLog?: (habitId: string) => void; // New: clear the log to go back to normal
  selectedDate?: string;
  selectedDateLog?: { completed: boolean } | undefined;
  isSelectedDateFrozen?: boolean;
}

export const SwipeableHabit: React.FC<SwipeableHabitProps> = ({
  habit,
  onSwipeRight,
  onSwipeLeft,
  onPress,
  onFreeze,
  onUnfreeze,
  onClearLog,
  selectedDate,
  selectedDateLog,
  isSelectedDateFrozen,
}) => {
  const { colors, isDark } = useTheme();

  // Use selected date log if provided, otherwise fall back to today's log
  const activeLog = selectedDate !== undefined ? selectedDateLog : habit.todayLog;
  const activeFrozen = selectedDate !== undefined ? isSelectedDateFrozen : habit.isTodayFrozen;

  const isCompleted = activeLog?.completed === true;
  const isNotCompleted = activeLog?.completed === false;
  const hasLog = activeLog !== undefined;
  const isFrozen = activeFrozen === true;
  const categoryConfig = getCategoryConfig(habit.category);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCompleted && onClearLog) {
      // If already done, clear the log to go back to normal
      onClearLog(habit.id);
    } else {
      onSwipeRight(habit.id);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isNotCompleted && onClearLog) {
      // If already skipped, clear the log to go back to normal
      onClearLog(habit.id);
    } else {
      onSwipeLeft(habit.id);
    }
  };

  const handleFreeze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFrozen) {
      onUnfreeze?.(habit.id);
    } else {
      onFreeze?.(habit.id);
    }
  };

  const handleStatusPress = () => {
    if (!onClearLog) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearLog(habit.id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.habitCard,
          {
            backgroundColor: hasLog
              ? (isDark ? 'rgba(26, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.5)')
              : colors.cardBackground,
            borderColor: isCompleted
              ? colors.success
              : isNotCompleted
                ? colors.error
                : isFrozen
                  ? '#64B5F6'
                  : colors.cardBorder,
            borderWidth: isCompleted || isNotCompleted || isFrozen ? 1.5 : 1,
          },
        ]}
        onPress={() => onPress?.(habit.id)}
        activeOpacity={0.8}
      >
        <View style={styles.habitContent}>
          {/* Done button - tap to toggle */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.successButton,
              {
                backgroundColor: isCompleted ? colors.success : (isDark ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 230, 118, 0.15)'),
                borderWidth: isCompleted ? 0 : 1.5,
                borderColor: colors.success,
              },
            ]}
            onPress={handleDone}
          >
            <Ionicons
              name={isCompleted ? 'checkmark' : 'checkmark'}
              size={18}
              color={isCompleted ? '#fff' : colors.success}
            />
          </TouchableOpacity>

          <View style={styles.habitInfo}>
            {habit.category && habit.category !== 'other' && (
              <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + '20' }]}>
                <Text style={styles.categoryEmoji}>{categoryConfig.emoji}</Text>
              </View>
            )}
            <Text
              style={[
                styles.habitName,
                { color: colors.text },
                hasLog && styles.dimmedText,
                isNotCompleted && styles.strikethrough,
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>

            {/* Tappable status badges to clear */}
            {isCompleted && (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: colors.successLight }]}
                onPress={handleStatusPress}
                disabled={!onClearLog}
              >
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>Done</Text>
              </TouchableOpacity>
            )}
            {isNotCompleted && (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: colors.errorLight }]}
                onPress={handleStatusPress}
                disabled={!onClearLog}
              >
                <Ionicons name="close-circle" size={12} color={colors.error} />
                <Text style={[styles.statusText, { color: colors.error }]}>Skipped</Text>
              </TouchableOpacity>
            )}
            {isFrozen && !hasLog && (
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(100, 181, 246, 0.2)' : 'rgba(100, 181, 246, 0.15)' }]}
                onPress={handleFreeze}
              >
                <Ionicons name="snow" size={12} color="#64B5F6" />
                <Text style={[styles.statusText, { color: '#64B5F6' }]}>Frozen</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightSection}>
            {habit.currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? 'rgba(255, 109, 0, 0.2)' : 'rgba(255, 109, 0, 0.15)' }]}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[styles.streakText, { color: colors.streak }]}>
                  {habit.currentStreak}
                </Text>
              </View>
            )}

            {/* Freeze button - only show when no log */}
            {(onFreeze || onUnfreeze) && !hasLog && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.freezeButton,
                  {
                    backgroundColor: isFrozen
                      ? '#64B5F6'
                      : (isDark ? 'rgba(100, 181, 246, 0.2)' : 'rgba(100, 181, 246, 0.1)'),
                    borderColor: '#64B5F6',
                  },
                ]}
                onPress={handleFreeze}
              >
                <Ionicons name="snow" size={16} color={isFrozen ? '#fff' : '#64B5F6'} />
              </TouchableOpacity>
            )}

            {/* Skip button - tap to toggle */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.errorButton,
                {
                  backgroundColor: isNotCompleted ? colors.error : (isDark ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255, 23, 68, 0.1)'),
                  borderColor: colors.error,
                  borderWidth: isNotCompleted ? 0 : 1.5,
                },
              ]}
              onPress={handleSkip}
            >
              <Ionicons name="close" size={18} color={isNotCompleted ? '#fff' : colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 5,
  },
  habitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#E040FB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorButton: {
    // No extra styles needed
  },
  freezeButton: {
    borderWidth: 1.5,
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  dimmedText: {
    opacity: 0.6,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
