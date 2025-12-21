import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface SectionHeaderProps {
  title: string;
  onAdd?: () => void;
  rightElement?: React.ReactNode;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onAdd,
  rightElement,
  subtitle,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightElement}
        {onAdd && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: isDark ? 'rgba(224, 64, 251, 0.15)' : 'rgba(224, 64, 251, 0.1)',
                borderColor: colors.primary,
              },
            ]}
            onPress={onAdd}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#E040FB',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
