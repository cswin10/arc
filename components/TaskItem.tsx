import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { ConfirmationModal } from './ConfirmationModal';
import type { DailyTask } from '../types/database';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onPriorityChange?: (taskId: string, priority: number) => void;
}

const getPriorityColor = (priority: number, colors: any) => {
  if (priority >= 8) return colors.error; // High priority - red
  if (priority >= 5) return colors.warning; // Medium priority - orange
  return colors.textTertiary; // Low priority - gray
};

const getPriorityLabel = (priority: number) => {
  if (priority >= 8) return 'High';
  if (priority >= 5) return 'Med';
  return 'Low';
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onPriorityChange }) => {
  const { colors, isDark } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const priority = task.priority ?? 5;
  const priorityColor = getPriorityColor(priority, colors);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id, !task.completed);
  };

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(task.id);
  };

  const cyclePriority = () => {
    if (!onPriorityChange) return;
    Haptics.selectionAsync();
    // Cycle: Low (1-4) -> Med (5-7) -> High (8-10) -> Low
    let newPriority: number;
    if (priority < 5) {
      newPriority = 5; // Low -> Med
    } else if (priority < 8) {
      newPriority = 9; // Med -> High
    } else {
      newPriority = 3; // High -> Low
    }
    onPriorityChange(task.id, newPriority);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: task.completed
            ? (isDark ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 230, 118, 0.06)')
            : colors.cardBackground,
          borderColor: task.completed ? colors.success : colors.cardBorder,
          borderLeftColor: task.completed ? colors.success : priorityColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handleToggle}
      >
        <View
          style={[
            styles.checkboxInner,
            {
              borderColor: task.completed ? colors.success : colors.textTertiary,
              backgroundColor: task.completed ? colors.success : 'transparent',
            },
          ]}
        >
          {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.taskName,
            { color: task.completed ? colors.textTertiary : colors.text },
            task.completed && styles.completed,
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
      </View>

      {onPriorityChange && !task.completed && (
        <TouchableOpacity
          style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}
          onPress={cyclePriority}
        >
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {getPriorityLabel(priority)}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.deleteButton,
          { backgroundColor: isDark ? 'rgba(255, 23, 68, 0.1)' : 'rgba(255, 23, 68, 0.08)' },
        ]}
        onPress={handleDeletePress}
      >
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>

      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        icon="trash-outline"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
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
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
});
