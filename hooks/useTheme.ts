import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { Colors } from '../constants/colors';

export const useTheme = () => {
  const { themeMode, currentTheme, isLoading, initialize, setThemeMode } = useUIStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const colors = Colors[currentTheme];

  return {
    themeMode,
    currentTheme,
    isLoading,
    colors,
    isDark: currentTheme === 'dark',
    setThemeMode,
  };
};
