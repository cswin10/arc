import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { Config } from '../constants/config';
import type { HabitWithStats } from '../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = Config.SWIPE_THRESHOLD;

interface SwipeableHabitProps {
  habit: HabitWithStats;
  onSwipeRight: (habitId: string) => void;
  onSwipeLeft: (habitId: string) => void;
  onPress?: (habitId: string) => void;
}

export const SwipeableHabit: React.FC<SwipeableHabitProps> = ({
  habit,
  onSwipeRight,
  onSwipeLeft,
  onPress,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSwipeRight = useCallback(() => {
    onSwipeRight(habit.id);
  }, [habit.id, onSwipeRight]);

  const handleSwipeLeft = useCallback(() => {
    onSwipeLeft(habit.id);
  }, [habit.id, onSwipeLeft]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(triggerHaptic)();
        runOnJS(handleSwipeRight)();
        translateX.value = withSpring(0);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(triggerHaptic)();
        runOnJS(handleSwipeLeft)();
        translateX.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPress) {
      runOnJS(onPress)(habit.id);
    }
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const isCompleted = habit.todayLog?.completed === true;
  const isNotCompleted = habit.todayLog?.completed === false;
  const hasLog = habit.todayLog !== undefined;

  return (
    <View style={styles.container}>
      {/* Left action (swipe right = done) */}
      <Animated.View
        style={[styles.actionContainer, styles.leftAction, { backgroundColor: colors.success }, leftActionStyle]}
      >
        <Text style={styles.actionText}>✓ Done</Text>
      </Animated.View>

      {/* Right action (swipe left = not done) */}
      <Animated.View
        style={[styles.actionContainer, styles.rightAction, { backgroundColor: colors.error }, rightActionStyle]}
      >
        <Text style={styles.actionText}>✗ Skip</Text>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.habitCard,
            {
              backgroundColor: hasLog ? colors.backgroundSecondary : colors.cardBackground,
              borderColor: colors.border,
              opacity: hasLog ? 0.7 : 1,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.habitContent}>
            <View style={styles.habitInfo}>
              <Text
                style={[
                  styles.habitName,
                  { color: colors.text },
                  isNotCompleted && styles.strikethrough,
                ]}
              >
                {habit.name}
              </Text>
              {isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>Done</Text>
                </View>
              )}
              {isNotCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: colors.errorLight }]}>
                  <Text style={[styles.statusText, { color: colors.error }]}>Skipped</Text>
                </View>
              )}
            </View>
            <View style={styles.streakContainer}>
              {habit.currentStreak > 0 && (
                <Text style={[styles.streakText, { color: colors.streak }]}>
                  🔥 {habit.currentStreak}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
    borderRadius: 12,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    borderRadius: 12,
  },
  leftAction: {
    alignItems: 'flex-start',
    paddingLeft: 24,
  },
  rightAction: {
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  habitCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  habitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
