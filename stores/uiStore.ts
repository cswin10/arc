import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';
}

const THEME_STORAGE_KEY = '@arc_theme_mode';

export const useUIStore = create<UIState>((set, get) => ({
  themeMode: 'system',
  currentTheme: 'light',
  isLoading: true,

  initialize: async () => {
    try {
      // Load saved theme preference
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const themeMode = (savedMode as ThemeMode) || 'system';

      // Get system theme
      const systemTheme = Appearance.getColorScheme() || 'light';

      // Calculate current theme
      const currentTheme = themeMode === 'system' ? systemTheme : themeMode;

      set({ themeMode, currentTheme, isLoading: false });

      // Listen for system theme changes
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        const { themeMode } = get();
        if (themeMode === 'system') {
          set({ currentTheme: colorScheme || 'light' });
        }
      });

      // Note: In a real app, you'd want to clean up this subscription
      // when the store is destroyed (though Zustand stores are typically
      // long-lived singletons)
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);

      const systemTheme = Appearance.getColorScheme() || 'light';
      const currentTheme = mode === 'system' ? systemTheme : mode;

      set({ themeMode: mode, currentTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  getEffectiveTheme: () => {
    const { themeMode, currentTheme } = get();
    if (themeMode === 'system') {
      return Appearance.getColorScheme() || 'light';
    }
    return currentTheme;
  },
}));
