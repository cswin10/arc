import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import {
  getArchivedHabits,
  getArchivedWeeklyGoals,
  getArchivedMonthlyGoals,
  getArchivedYearlyGoals,
  restoreHabit,
  restoreWeeklyGoal,
  restoreMonthlyGoal,
  restoreYearlyGoal,
  deleteHabit,
  deleteWeeklyGoal,
  deleteMonthlyGoal,
  deleteYearlyGoal,
} from '../lib/database';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Habit, WeeklyGoal, MonthlyGoal, YearlyGoal } from '../types/database';

type ArchivedItem = {
  id: string;
  name: string;
  type: 'habit' | 'weekly_goal' | 'monthly_goal' | 'yearly_goal';
  subtype?: 'daily' | 'weekly';
};

export default function ArchivedScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ArchivedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; item: ArchivedItem | null }>({
    visible: false,
    item: null,
  });

  const fetchArchivedItems = useCallback(async () => {
    if (!user) return;

    try {
      const [habits, weeklyGoals, monthlyGoals, yearlyGoals] = await Promise.all([
        getArchivedHabits(user.id),
        getArchivedWeeklyGoals(user.id),
        getArchivedMonthlyGoals(user.id),
        getArchivedYearlyGoals(user.id),
      ]);

      const allItems: ArchivedItem[] = [
        ...habits.map((h) => ({
          id: h.id,
          name: h.name,
          type: 'habit' as const,
          subtype: h.type as 'daily' | 'weekly',
        })),
        ...weeklyGoals.map((g) => ({
          id: g.id,
          name: g.name,
          type: 'weekly_goal' as const,
        })),
        ...monthlyGoals.map((g) => ({
          id: g.id,
          name: g.name,
          type: 'monthly_goal' as const,
        })),
        ...yearlyGoals.map((g) => ({
          id: g.id,
          name: g.name,
          type: 'yearly_goal' as const,
        })),
      ];

      setItems(allItems);
    } catch (error) {
      console.error('Failed to fetch archived items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArchivedItems();
  }, [fetchArchivedItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchArchivedItems();
    setRefreshing(false);
  }, [fetchArchivedItems]);

  const handleRestore = async (item: ArchivedItem) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      switch (item.type) {
        case 'habit':
          await restoreHabit(item.id);
          break;
        case 'weekly_goal':
          await restoreWeeklyGoal(item.id);
          break;
        case 'monthly_goal':
          await restoreMonthlyGoal(item.id);
          break;
        case 'yearly_goal':
          await restoreYearlyGoal(item.id);
          break;
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to restore item');
    }
  };

  const handleDelete = (item: ArchivedItem) => {
    setDeleteDialog({ visible: true, item });
  };

  const confirmDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      switch (item.type) {
        case 'habit':
          await deleteHabit(item.id);
          break;
        case 'weekly_goal':
          await deleteWeeklyGoal(item.id);
          break;
        case 'monthly_goal':
          await deleteMonthlyGoal(item.id);
          break;
        case 'yearly_goal':
          await deleteYearlyGoal(item.id);
          break;
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setDeleteDialog({ visible: false, item: null });
    }
  };

  const getTypeLabel = (item: ArchivedItem) => {
    switch (item.type) {
      case 'habit':
        return item.subtype === 'weekly' ? 'Weekly Habit' : 'Daily Habit';
      case 'weekly_goal':
        return 'Weekly Goal';
      case 'monthly_goal':
        return 'Monthly Goal';
      case 'yearly_goal':
        return 'Yearly Goal';
    }
  };

  const getTypeIcon = (item: ArchivedItem) => {
    switch (item.type) {
      case 'habit':
        return item.subtype === 'weekly' ? 'repeat-outline' : 'fitness-outline';
      case 'weekly_goal':
        return 'calendar-outline';
      case 'monthly_goal':
        return 'today-outline';
      case 'yearly_goal':
        return 'flag-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Archived Items',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Archived Items',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="archive-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No archived items</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Items you archive will appear here
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            >
              <View style={styles.itemInfo}>
                <Ionicons name={getTypeIcon(item) as any} size={20} color={colors.textSecondary} />
                <View style={styles.itemText}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemType, { color: colors.textTertiary }]}>
                    {getTypeLabel(item)}
                  </Text>
                </View>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => handleRestore(item)}
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        visible={deleteDialog.visible}
        title="Delete Permanently"
        message={`Are you sure you want to permanently delete "${deleteDialog.item?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ visible: false, item: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemType: {
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
});
