import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWeeklyPlanningReminder,
  cancelWeeklyPlanningReminder,
  scheduleMonthlyPlanningReminder,
  cancelMonthlyPlanningReminder,
  requestNotificationPermissions,
} from '../../lib/notifications';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

const SettingRow: React.FC<SettingRowProps & { colors: ReturnType<typeof useTheme>['colors'] }> = ({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger = false,
  colors,
}) => (
  <TouchableOpacity
    style={[styles.settingRow, { borderBottomColor: colors.border }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingLeft}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? colors.error : colors.textSecondary}
        style={styles.settingIcon}
      />
      <Text style={[styles.settingLabel, { color: danger ? colors.error : colors.text }]}>
        {label}
      </Text>
    </View>
    {rightElement || (
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
        )}
        {onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
      </View>
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { user, logout, removeAccount, updateSettings, isLoading } = useAuth();

  const notificationPrefs = user?.settings?.notification_preferences || {
    daily_reminder: true,
    daily_reminder_time: '09:00',
    weekly_planning_reminder: true,
    monthly_planning_reminder: true,
  };

  const handleThemeChange = async () => {
    const nextMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    await setThemeMode(nextMode);
    await updateSettings({ dark_mode: nextMode === 'dark' });
  };

  const handleDailyReminderToggle = async (value: boolean) => {
    const newPrefs = { ...notificationPrefs, daily_reminder: value };
    await updateSettings({ notification_preferences: newPrefs });

    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyReminder(notificationPrefs.daily_reminder_time);
      }
    } else {
      await cancelDailyReminder();
    }
  };

  const handleWeeklyReminderToggle = async (value: boolean) => {
    const newPrefs = { ...notificationPrefs, weekly_planning_reminder: value };
    await updateSettings({ notification_preferences: newPrefs });

    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleWeeklyPlanningReminder();
      }
    } else {
      await cancelWeeklyPlanningReminder();
    }
  };

  const handleMonthlyReminderToggle = async (value: boolean) => {
    const newPrefs = { ...notificationPrefs, monthly_planning_reminder: value };
    await updateSettings({ notification_preferences: newPrefs });

    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleMonthlyPlanningReminder();
      }
    } else {
      await cancelMonthlyPlanningReminder();
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your habits, goals, and progress will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await removeAccount();
                    if (result.success) {
                      router.replace('/(auth)/login');
                    } else {
                      Alert.alert('Error', result.error || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const themeLabel = themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'System';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="mail-outline"
          label="Email"
          value={user?.email}
          colors={colors}
        />
        <SettingRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
          colors={colors}
        />
        <SettingRow
          icon="log-out-outline"
          label="Log Out"
          onPress={handleLogout}
          colors={colors}
        />
      </View>

      {/* Appearance Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon={isDark ? 'moon' : 'sunny-outline'}
          label="Theme"
          value={themeLabel}
          onPress={handleThemeChange}
          colors={colors}
        />
      </View>

      {/* Notifications Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Notifications</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="alarm-outline"
          label="Daily Reminder"
          rightElement={
            <Switch
              value={notificationPrefs.daily_reminder}
              onValueChange={handleDailyReminderToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationPrefs.daily_reminder ? colors.primary : colors.textTertiary}
            />
          }
          colors={colors}
        />
        <SettingRow
          icon="calendar-outline"
          label="Weekly Planning Reminder"
          rightElement={
            <Switch
              value={notificationPrefs.weekly_planning_reminder}
              onValueChange={handleWeeklyReminderToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={
                notificationPrefs.weekly_planning_reminder ? colors.primary : colors.textTertiary
              }
            />
          }
          colors={colors}
        />
        <SettingRow
          icon="today-outline"
          label="Monthly Planning Reminder"
          rightElement={
            <Switch
              value={notificationPrefs.monthly_planning_reminder}
              onValueChange={handleMonthlyReminderToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={
                notificationPrefs.monthly_planning_reminder ? colors.primary : colors.textTertiary
              }
            />
          }
          colors={colors}
        />
      </View>

      {/* Habits & Goals Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Habits & Goals</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="archive-outline"
          label="Archived Items"
          onPress={() => router.push('/archived')}
          colors={colors}
        />
      </View>

      {/* Stats Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Stats</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="stats-chart-outline"
          label="View Statistics"
          onPress={() => router.push('/stats')}
          colors={colors}
        />
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Data</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="download-outline"
          label="Export Data"
          onPress={() => Alert.alert('Coming Soon', 'Data export will be available soon.')}
          colors={colors}
        />
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionHeader, { color: colors.error }]}>Danger Zone</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingRow
          icon="trash-outline"
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
          colors={colors}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.primary }]}>Arc</Text>
        <Text style={[styles.appVersion, { color: colors.textTertiary }]}>Version 1.0.0</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
