import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface AmountInputModalProps {
  visible: boolean;
  habitName: string;
  currentDayAmount?: number;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const QUICK_AMOUNTS = [1, 5, 10, 15, 30, 60];

export const AmountInputModal: React.FC<AmountInputModalProps> = ({
  visible,
  habitName,
  currentDayAmount = 0,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleQuickAmount = async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(value);
    onClose();
  };

  const handleSubmit = async () => {
    const numAmount = parseInt(amount);
    if (!amount || isNaN(numAmount) || numAmount < 1) {
      setError('Please enter a valid amount');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(numAmount);
    onClose();
  };

  const handleClose = async () => {
    await Haptics.selectionAsync();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Log Amount</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.habitName, { color: colors.textSecondary }]} numberOfLines={1}>
              {habitName}
            </Text>

            {currentDayAmount > 0 && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
                  Today: {currentDayAmount} logged
                </Text>
              </View>
            )}

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Quick add</Text>
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quickButton,
                    {
                      backgroundColor: isDark
                        ? colors.primary + '20'
                        : colors.primary + '15',
                      borderColor: colors.primary + '40',
                    },
                  ]}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>
                    +{value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Or enter custom amount</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder="Enter amount..."
                placeholderTextColor={colors.textTertiary}
                value={amount}
                onChangeText={(text) => {
                  setAmount(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  habitName: {
    fontSize: 14,
    marginBottom: 12,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
  },
});
