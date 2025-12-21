import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ProgressBar } from './ProgressBar';
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
  const { colors } = useTheme();

  const target = habit.weeklyTarget?.target || 0;
  const current = habit.currentProgress;
  const progress = target > 0 ? current / target : 0;
  const isComplete = current >= target;
  const progressColor = isComplete ? colors.success : colors.primary;

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
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} progressColor={progressColor} height={6} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {current}/{target}
            </Text>
          </View>
        </View>

        {onIncrement && (
          <TouchableOpacity
            style={[styles.incrementButton, { backgroundColor: progressColor }]}
            onPress={(e) => {
              e.stopPropagation();
              onIncrement();
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
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
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
  },
  incrementButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
