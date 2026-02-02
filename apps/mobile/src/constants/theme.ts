// Ruta Segura Perú - Design Tokens
// Sistema de diseño unificado para toda la aplicación

export const Colors = {
    // Primary Brand Colors
    primary: '#1152d4',
    primaryLight: '#117dd4',
    primaryDark: '#0d3fa0',

    // Backgrounds
    backgroundLight: '#f6f6f8',
    backgroundDark: '#101622',
    surfaceLight: '#ffffff',
    surfaceDark: '#1c2431',
    surfaceDarkAlt: '#192233',

    // Status Colors
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    info: '#3b82f6',

    // Text Colors
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#92a4c9',
    textLight: '#ffffff',
    textDark: '#1e293b',

    // Borders
    borderLight: '#e2e8f0',
    borderDark: '#324467',

    // Specific UI Elements
    sosRed: '#dc2626',
    translatePurple: '#6366f1',
    mapBlue: '#0ea5e9',

    // Gradients (as array for LinearGradient)
    gradientPrimary: ['#1152d4', '#117dd4'],
    gradientDark: ['#101622', '#1c2431'],
    gradientDanger: ['#dc2626', '#ef4444'],
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};

export const Typography = {
    // Font Families
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },

    // Font Sizes
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 28,
        display: 32,
    },

    // Line Heights
    lineHeight: {
        tight: 1.1,
        normal: 1.4,
        relaxed: 1.6,
    },

    // Font Weights
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        extrabold: '800' as const,
    },
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    primary: {
        shadowColor: '#1152d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    danger: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
};

// Theme configurations for light/dark mode
export const LightTheme = {
    background: Colors.backgroundLight,
    surface: Colors.surfaceLight,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    border: Colors.borderLight,
    primary: Colors.primary,
};

export const DarkTheme = {
    background: Colors.backgroundDark,
    surface: Colors.surfaceDark,
    text: Colors.textLight,
    textSecondary: Colors.textMuted,
    border: Colors.borderDark,
    primary: Colors.primary,
};
