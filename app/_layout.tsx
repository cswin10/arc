import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  const { isInitialized, isLoading: authLoading } = useAuth();
  const { isLoading: themeLoading, colors, isDark } = useTheme();

  // Show loading screen while initializing
  if (!isInitialized || themeLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="habit/[id]"
            options={{
              headerShown: true,
              title: 'Habit Details',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="goal/[id]"
            options={{
              headerShown: true,
              title: 'Goal Details',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              headerShown: true,
              title: 'Statistics',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="plan-week"
            options={{
              headerShown: true,
              title: 'Plan Your Week',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="plan-month"
            options={{
              headerShown: true,
              title: 'Plan Your Month',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              presentation: 'modal',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
});
