import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 40,
  noPadding = false,
}) => {
  const { colors, isDark } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blur,
            {
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <View style={[styles.content, noPadding && styles.noPadding]}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  // Android fallback - use semi-transparent background
  return (
    <View
      style={[
        styles.container,
        styles.androidCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  blur: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  androidCard: {
    borderWidth: 1,
    // Android shadow
    elevation: 4,
    shadowColor: '#E040FB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  noPadding: {
    padding: 0,
  },
});
