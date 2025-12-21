import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { HabitWithStats } from '../types/database';

interface SwipeableHabitProps {
  habit: HabitWithStats;
  onSwipeRight: (habitId: string) => void;
  onSwipeLeft: (habitId: string) => void;
  onPress?: (habitId: string) => void;
}

export const SwipeableHabit: React.FC<SwipeableHabitProps> = ({
  habit,
  onSwipeRight,
  onSwipeLeft,
  onPress,
}) => {
  const { colors } = useTheme();

  const isCompleted = habit.todayLog?.completed === true;
  const isNotCompleted = habit.todayLog?.completed === false;
  const hasLog = habit.todayLog !== undefined;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.habitCard,
          {
            backgroundColor: hasLog ? colors.backgroundSecondary : colors.cardBackground,
            borderColor: colors.border,
            opacity: hasLog ? 0.7 : 1,
          },
        ]}
        onPress={() => onPress?.(habit.id)}
        activeOpacity={0.7}
      >
        <View style={styles.habitContent}>
          {/* Done button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => onSwipeRight(habit.id)}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.habitInfo}>
            <Text
              style={[
                styles.habitName,
                { color: colors.text },
                isNotCompleted && styles.strikethrough,
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {isCompleted && (
              <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>Done</Text>
              </View>
            )}
            {isNotCompleted && (
              <View style={[styles.statusBadge, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.statusText, { color: colors.error }]}>Skipped</Text>
              </View>
            )}
          </View>

          <View style={styles.rightSection}>
            {habit.currentStreak > 0 && (
              <Text style={[styles.streakText, { color: colors.streak }]}>
                🔥 {habit.currentStreak}
              </Text>
            )}
            {/* Skip button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={() => onSwipeLeft(habit.id)}
            >
              <Ionicons name="close" size={20} color="#fff" />
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
    marginVertical: 4,
  },
  habitCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
