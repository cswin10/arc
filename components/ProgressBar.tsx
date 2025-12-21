import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showOverflow?: boolean; // If true, shows progress > 100% in a different color
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  showOverflow = false,
}) => {
  const { colors } = useTheme();

  const bgColor = backgroundColor || colors.backgroundTertiary;
  const fillColor = progressColor || colors.primary;

  // Clamp progress between 0 and 1 for display (unless showing overflow)
  const displayProgress = showOverflow ? Math.min(progress, 1) : Math.min(Math.max(progress, 0), 1);
  const overflowProgress = showOverflow && progress > 1 ? Math.min(progress - 1, 1) : 0;

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor }]}>
      <View
        style={[
          styles.progress,
          {
            width: `${displayProgress * 100}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
      {overflowProgress > 0 && (
        <View
          style={[
            styles.overflow,
            {
              width: `${overflowProgress * 100}%`,
              left: '100%',
              backgroundColor: colors.success,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  overflow: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
});
