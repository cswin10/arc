import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface CompletionPopupProps {
  visible: boolean;
  habitName: string;
  current: number;
  target: number;
  onHide: () => void;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({
  visible,
  habitName,
  current,
  target,
  onHide,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const isComplete = current >= target;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (isComplete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      checkmarkScale.setValue(0);
      confettiAnim.setValue(0);

      // Run animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      if (isComplete) {
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }

      // Auto hide after delay
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, isComplete ? 2500 : 1500);

      return () => clearTimeout(timer);
    }
  }, [visible, isComplete]);

  if (!visible) return null;

  const progressPercent = Math.min(100, Math.round((current / target) * 100));

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBackground,
              borderColor: isComplete ? colors.success + '40' : colors.primary + '40',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Checkmark/Progress Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isComplete ? colors.success + '20' : colors.primary + '20',
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Ionicons
              name={isComplete ? 'checkmark-circle' : 'add-circle'}
              size={48}
              color={isComplete ? colors.success : colors.primary}
            />
          </Animated.View>

          {/* Message */}
          <Text style={[styles.title, { color: colors.text }]}>
            {isComplete ? 'Target Reached!' : 'Progress Updated'}
          </Text>
          <Text style={[styles.habitName, { color: colors.textSecondary }]} numberOfLines={2}>
            {habitName}
          </Text>

          {/* Progress Display */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.backgroundTertiary }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isComplete ? colors.success : colors.primary,
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressText, { color: isComplete ? colors.success : colors.primary }]}>
                {current}/{target}
              </Text>
              {isComplete && (
                <Text style={[styles.completeText, { color: colors.success }]}>
                  Complete!
                </Text>
              )}
            </View>
          </View>

          {/* Streak flame for completion */}
          {isComplete && (
            <View style={styles.celebrationContainer}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    width: 280,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  celebrationContainer: {
    marginTop: 12,
  },
  celebrationEmoji: {
    fontSize: 32,
  },
});
