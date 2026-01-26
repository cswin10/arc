import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Modal } from 'react-native';
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
  onEdit?: (taskId: string, name: string) => void;
  onMoveToDate?: (taskId: string, newDate: string) => void;
}

const getPriorityColor = (priority: number, colors: any) => {
  if (priority >= 8) return colors.error; // High priority - red
  if (priority >= 5) return '#FFB74D'; // Medium priority - yellow/amber
  return colors.textTertiary; // Low priority - gray
};

const getPriorityLabel = (priority: number) => {
  if (priority >= 8) return 'High';
  if (priority >= 5) return 'Med';
  return 'Low';
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onPriorityChange, onEdit, onMoveToDate }) => {
  const { colors, isDark } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const priority = task.priority ?? 5;
  const priorityColor = getPriorityColor(priority, colors);

  const handleMoveToTomorrow = () => {
    if (!onMoveToDate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tomorrow = new Date(task.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    onMoveToDate(task.id, tomorrowStr);
    setShowEditModal(false);
  };

  const handleMoveToYesterday = () => {
    if (!onMoveToDate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const yesterday = new Date(task.date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    onMoveToDate(task.id, yesterdayStr);
    setShowEditModal(false);
  };

  const handleEditPress = () => {
    Haptics.selectionAsync();
    setEditName(task.name);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editName.trim() && editName.trim() !== task.name) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEdit(task.id, editName.trim());
    }
    setShowEditModal(false);
  };

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

      {onEdit && !task.completed && (
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: isDark ? 'rgba(224, 64, 251, 0.1)' : 'rgba(224, 64, 251, 0.08)' },
          ]}
          onPress={handleEditPress}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Task</Text>
            <TextInput
              style={[
                styles.editInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              onSubmitEditing={handleSaveEdit}
              returnKeyType="done"
            />

            {/* Move to different day */}
            {onMoveToDate && (
              <View style={styles.moveDateSection}>
                <Text style={[styles.moveDateLabel, { color: colors.textSecondary }]}>Move to</Text>
                <View style={styles.moveDateButtons}>
                  <TouchableOpacity
                    style={[styles.moveDateButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={handleMoveToYesterday}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} />
                    <Text style={[styles.moveDateButtonText, { color: colors.text }]}>Yesterday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moveDateButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={handleMoveToTomorrow}
                  >
                    <Text style={[styles.moveDateButtonText, { color: colors.primary }]}>Tomorrow</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  editButton: {
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  moveDateSection: {
    marginBottom: 16,
  },
  moveDateLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moveDateButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  moveDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  moveDateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
