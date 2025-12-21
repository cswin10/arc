import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { DailyTask } from '../types/database';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: task.completed
            ? (isDark ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 230, 118, 0.06)')
            : colors.cardBackground,
          borderColor: task.completed ? colors.success : colors.cardBorder,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(task.id, !task.completed)}
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

      <TouchableOpacity
        style={[
          styles.deleteButton,
          { backgroundColor: isDark ? 'rgba(255, 23, 68, 0.1)' : 'rgba(255, 23, 68, 0.08)' },
        ]}
        onPress={() => onDelete(task.id)}
      >
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
    marginRight: 14,
  },
  checkboxInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
});
