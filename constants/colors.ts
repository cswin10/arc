// Neon glassmorphism color palette for Arc app

export const Colors = {
  light: {
    // Primary gradient colors (pink to purple to orange)
    primary: '#E040FB', // Neon pink/magenta
    primaryLight: '#EA80FC',
    primaryDark: '#AA00FF',
    secondary: '#7C4DFF', // Purple
    accent: '#FF6D00', // Neon orange
    accentLight: '#FF9E40',

    // Background with subtle gradient feel
    background: '#FAF5FF', // Very light purple tint
    backgroundSecondary: '#F3E5F5',
    backgroundTertiary: '#E1BEE7',

    // Glass effect colors
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(224, 64, 251, 0.2)',
    glassHighlight: 'rgba(255, 255, 255, 0.9)',

    // Text
    text: '#1A1A2E', // Deep dark blue
    textSecondary: '#4A4A68',
    textTertiary: '#8888A0',

    // Status with neon tints
    success: '#00E676', // Neon green
    successLight: '#B9F6CA',
    error: '#FF1744', // Neon red
    errorLight: '#FF8A80',
    warning: '#FFAB00', // Neon amber
    warningLight: '#FFE57F',

    // Borders
    border: 'rgba(124, 77, 255, 0.15)',
    borderLight: 'rgba(224, 64, 251, 0.1)',

    // Specific
    streak: '#FF6D00', // Orange for streak fire
    completed: '#00E676',
    notCompleted: '#FF1744',
    cardBackground: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(224, 64, 251, 0.25)',
    tabBar: 'rgba(255, 255, 255, 0.95)',
    tabBarInactive: '#8888A0',

    // Gradients (for use with LinearGradient)
    gradientStart: '#E040FB',
    gradientMid: '#7C4DFF',
    gradientEnd: '#FF6D00',
  },
  dark: {
    // Primary gradient colors
    primary: '#E040FB',
    primaryLight: '#EA80FC',
    primaryDark: '#AA00FF',
    secondary: '#7C4DFF',
    accent: '#FF6D00',
    accentLight: '#FF9E40',

    // Background - deep dark with purple undertones
    background: '#0D0D1A', // Very dark purple-black
    backgroundSecondary: '#1A1A2E',
    backgroundTertiary: '#2D2D44',

    // Glass effect colors (dark mode)
    glass: 'rgba(26, 26, 46, 0.8)',
    glassBorder: 'rgba(224, 64, 251, 0.3)',
    glassHighlight: 'rgba(255, 255, 255, 0.1)',

    // Text
    text: '#FAFAFA',
    textSecondary: '#B8B8D0',
    textTertiary: '#7878A0',

    // Status with neon tints
    success: '#00E676',
    successLight: 'rgba(0, 230, 118, 0.2)',
    error: '#FF1744',
    errorLight: 'rgba(255, 23, 68, 0.2)',
    warning: '#FFAB00',
    warningLight: 'rgba(255, 171, 0, 0.2)',

    // Borders
    border: 'rgba(124, 77, 255, 0.3)',
    borderLight: 'rgba(224, 64, 251, 0.15)',

    // Specific
    streak: '#FF6D00',
    completed: '#00E676',
    notCompleted: '#FF1744',
    cardBackground: 'rgba(26, 26, 46, 0.9)',
    cardBorder: 'rgba(224, 64, 251, 0.35)',
    tabBar: 'rgba(13, 13, 26, 0.98)',
    tabBarInactive: '#5858A0',

    // Gradients
    gradientStart: '#E040FB',
    gradientMid: '#7C4DFF',
    gradientEnd: '#FF6D00',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
