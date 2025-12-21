// Color palette for Arc app

export const Colors = {
  light: {
    // Primary
    primary: '#3B82F6', // Blue
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',

    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',

    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Status
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',

    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Specific
    streak: '#F97316', // Orange for streak fire
    completed: '#10B981',
    notCompleted: '#EF4444',
    cardBackground: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarInactive: '#9CA3AF',
  },
  dark: {
    // Primary
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',

    // Background
    background: '#111827',
    backgroundSecondary: '#1F2937',
    backgroundTertiary: '#374151',

    // Text
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',

    // Status
    success: '#10B981',
    successLight: '#064E3B',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    warning: '#F59E0B',
    warningLight: '#78350F',

    // Borders
    border: '#374151',
    borderLight: '#1F2937',

    // Specific
    streak: '#F97316',
    completed: '#10B981',
    notCompleted: '#EF4444',
    cardBackground: '#1F2937',
    tabBar: '#1F2937',
    tabBarInactive: '#6B7280',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
