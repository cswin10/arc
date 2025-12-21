import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  accentColor?: string;
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
  accentColor,
}) => {
  const { colors, isDark } = useTheme();

  const progress = target > 0 ? current / target : 0;
  const isComplete = current >= target;
  const progressColor = isComplete ? colors.success : (accentColor || colors.primary);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: accentColor ? accentColor + '30' : colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {isComplete && (
            <View style={[styles.completeBadge, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            </View>
          )}
          <Text
            style={[
              styles.name,
              { color: colors.text },
              isComplete && styles.completedName,
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>
          {isRecurring && (
            <Ionicons
              name="repeat"
              size={14}
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

      {onIncrement && !isComplete && (
        <TouchableOpacity
          style={[
            styles.incrementButton,
            {
              backgroundColor: isDark
                ? (accentColor || colors.primary) + '25'
                : (accentColor || colors.primary) + '15',
              borderColor: (accentColor || colors.primary) + '50',
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onIncrement();
          }}
        >
          <Ionicons name="add" size={18} color={accentColor || colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#E040FB',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
    gap: 8,
  },
  completeBadge: {
    padding: 2,
    borderRadius: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  completedName: {
    opacity: 0.7,
  },
  recurringIcon: {
    marginLeft: 4,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  current: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  target: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 10,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
