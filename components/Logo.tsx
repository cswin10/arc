import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const { colors } = useTheme();

  const sizes = {
    small: { container: 32, arc: 24, text: 16, strokeWidth: 3 },
    medium: { container: 56, arc: 42, text: 28, strokeWidth: 4 },
    large: { container: 80, arc: 60, text: 40, strokeWidth: 5 },
  };

  const s = sizes[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            width: s.container,
            height: s.container,
            borderRadius: s.container / 2,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Outer glow */}
        <View
          style={[
            styles.glowOuter,
            {
              width: s.container,
              height: s.container,
              borderRadius: s.container / 2,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 15,
              elevation: 10,
            },
          ]}
        />

        {/* Arc shape - using a View with partial border */}
        <View
          style={[
            styles.arcContainer,
            {
              width: s.arc,
              height: s.arc,
              borderRadius: s.arc / 2,
            },
          ]}
        >
          {/* Top arc segment - pink */}
          <View
            style={[
              styles.arcSegment,
              {
                width: s.arc,
                height: s.arc,
                borderRadius: s.arc / 2,
                borderWidth: s.strokeWidth,
                borderColor: 'transparent',
                borderTopColor: '#E040FB',
                borderRightColor: '#E040FB',
                transform: [{ rotate: '-45deg' }],
              },
            ]}
          />
          {/* Bottom arc segment - purple */}
          <View
            style={[
              styles.arcSegment,
              styles.arcSegmentOverlay,
              {
                width: s.arc,
                height: s.arc,
                borderRadius: s.arc / 2,
                borderWidth: s.strokeWidth,
                borderColor: 'transparent',
                borderBottomColor: '#7C4DFF',
                borderLeftColor: '#7C4DFF',
                transform: [{ rotate: '-45deg' }],
              },
            ]}
          />
          {/* Accent dot - orange */}
          <View
            style={[
              styles.accentDot,
              {
                width: s.strokeWidth * 2.5,
                height: s.strokeWidth * 2.5,
                borderRadius: s.strokeWidth * 1.25,
                backgroundColor: '#FF6D00',
                top: s.strokeWidth / 2,
                right: s.arc * 0.15,
                shadowColor: '#FF6D00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 5,
              },
            ]}
          />
        </View>
      </View>

      {showText && (
        <Text
          style={[
            styles.logoText,
            {
              fontSize: s.text,
              color: colors.text,
            },
          ]}
        >
          Arc
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  glowOuter: {
    position: 'absolute',
  },
  arcContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcSegment: {
    position: 'absolute',
  },
  arcSegmentOverlay: {
    position: 'absolute',
  },
  accentDot: {
    position: 'absolute',
  },
  logoText: {
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 1,
  },
});
