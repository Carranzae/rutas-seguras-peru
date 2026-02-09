// Ruta Segura Perú - Premium Sci-Fi Design Tokens
// Futuristic dark theme with neon accents and glassmorphism

export const Colors = {
    // Primary Brand Colors - Neon Futuristic
    primary: '#00F5FF',           // Electric Cyan
    primaryLight: '#67FFFF',
    primaryDark: '#00B8C4',

    // Secondary Accent - Neon Red
    accent: '#FF073A',            // Neon Red
    accentLight: '#FF4D6D',
    accentDark: '#CC0530',

    // Backgrounds - Deep Space
    backgroundLight: '#f6f6f8',
    backgroundDark: '#020617',    // Deep space black
    surfaceLight: '#ffffff',
    surfaceDark: '#0A1628',       // Dark navy
    surfaceDarkAlt: '#0F172A',    // Slate 900
    surfaceElevated: '#1E293B',   // Slate 800

    // Glassmorphism
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBgHover: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderBright: 'rgba(0, 245, 255, 0.3)',

    // Status Colors - Vibrant
    success: '#00FF88',           // Neon green
    successLight: '#33FFAA',
    successBg: 'rgba(0, 255, 136, 0.15)',
    warning: '#FFB800',           // Amber
    warningLight: '#FFCF4D',
    warningBg: 'rgba(255, 184, 0, 0.15)',
    danger: '#FF073A',            // Neon red
    dangerLight: '#FF4D6D',
    dangerBg: 'rgba(255, 7, 58, 0.15)',
    info: '#00F5FF',              // Electric cyan

    // Text Colors
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94A3B8',
    textLight: '#F8FAFC',
    textDark: '#1e293b',
    textNeon: '#00F5FF',
    textNeonRed: '#FF073A',

    // Borders
    borderLight: '#e2e8f0',
    borderDark: '#1E293B',
    borderNeon: '#00F5FF',

    // Specific UI Elements
    sosRed: '#FF073A',
    sosPulse: '#FF4D6D',
    translatePurple: '#A855F7',
    mapBlue: '#00F5FF',

    // Glow Effects
    glowCyan: 'rgba(0, 245, 255, 0.4)',
    glowRed: 'rgba(255, 7, 58, 0.4)',
    glowPurple: 'rgba(168, 85, 247, 0.4)',

    // Gradients (as array for LinearGradient)
    gradientPrimary: ['#00F5FF', '#0891B2'],
    gradientDark: ['#020617', '#0F172A'],
    gradientDanger: ['#FF073A', '#FF4D6D'],
    gradientNeon: ['#00F5FF', '#A855F7'],
    gradientGlass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)'],
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
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
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
        hero: 40,
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
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    // Neon Glow Shadows
    neonCyan: {
        shadowColor: '#00F5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
    },
    neonRed: {
        shadowColor: '#FF073A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
    },
    neonRedIntense: {
        shadowColor: '#FF073A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 12,
    },
    glass: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 10,
    },
    // Legacy (keeping for compatibility)
    primary: {
        shadowColor: '#00F5FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    danger: {
        shadowColor: '#FF073A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
};

// Animation Presets for react-native-reanimated
export const Animations = {
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
        pulse: 1500,
    },
    spring: {
        default: { damping: 15, stiffness: 150 },
        bouncy: { damping: 10, stiffness: 200 },
        gentle: { damping: 20, stiffness: 100 },
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
    surfaceElevated: Colors.surfaceElevated,
    text: Colors.textLight,
    textSecondary: Colors.textMuted,
    textNeon: Colors.textNeon,
    border: Colors.borderDark,
    primary: Colors.primary,
    accent: Colors.accent,
    glass: Colors.glassBg,
    glassBorder: Colors.glassBorder,
};

