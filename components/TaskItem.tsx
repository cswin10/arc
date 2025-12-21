import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { DailyTask } from '../types/database';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
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
              borderColor: task.completed ? colors.success : colors.border,
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

      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(task.id)}>
        <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskName: {
    flex: 1,
    fontSize: 16,
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 4,
  },
});
