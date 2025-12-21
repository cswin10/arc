import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ProgressBar } from './ProgressBar';

interface GoalCardProps {
  name: string;
  current: number;
  target: number;
  onPress?: () => void;
  onIncrement?: () => void;
  isRecurring?: boolean;
  showProgress?: boolean;
  linkedGoalName?: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  name,
  current,
  target,
  onPress,
  onIncrement,
  isRecurring = false,
  showProgress = true,
  linkedGoalName,
}) => {
  const { colors } = useTheme();

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
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {name}
          </Text>
          {isRecurring && (
            <Ionicons
              name="repeat"
              size={16}
              color={colors.textTertiary}
              style={styles.recurringIcon}
            />
          )}
        </View>
        <View style={styles.progressText}>
          <Text style={[styles.current, { color: progressColor }]}>{current}</Text>
          <Text style={[styles.divider, { color: colors.textTertiary }]}>/</Text>
          <Text style={[styles.target, { color: colors.textSecondary }]}>{target}</Text>
        </View>
      </View>

      {showProgress && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} progressColor={progressColor} showOverflow />
        </View>
      )}

      {linkedGoalName && (
        <View style={styles.linkedContainer}>
          <Ionicons name="link" size={12} color={colors.textTertiary} />
          <Text style={[styles.linkedText, { color: colors.textTertiary }]} numberOfLines={1}>
            {linkedGoalName}
          </Text>
        </View>
      )}

      {onIncrement && (
        <TouchableOpacity
          style={[styles.incrementButton, { backgroundColor: colors.primaryLight }]}
          onPress={(e) => {
            e.stopPropagation();
            onIncrement();
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  recurringIcon: {
    marginLeft: 8,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  current: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  target: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 12,
  },
  linkedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  linkedText: {
    fontSize: 12,
    flex: 1,
  },
  incrementButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
