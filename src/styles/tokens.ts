/**
 * Momentum Design Tokens
 * Source of truth for all design values.
 * Strictly follows .agent/rules/design-system.md
 */

export const tokens = {
  colors: {
    // ── Brand ──────────────────────────────────
    primary50: '#FFF7ED',
    primary100: '#FFEDD5',
    primary200: '#FED7AA',
    primary300: '#FDBA74',
    primary400: '#FB923C',
    primary500: '#F97316', // Main brand orange
    primary600: '#EA580C',
    primary700: '#C2410C',
    primary800: '#9A3412',
    primary900: '#7C2D12',

    // ── Neutrals (Light Mode Default) ──────────
    bgBase: '#FFFFFF',
    bgSurface: '#FAFAF9',
    bgElevated: '#F5F5F4',
    borderBase: '#E7E7E4',
    borderLight: '#D6D6D2',

    textPrimary: '#0C0C0A',
    textSecondary: '#4A4A48',
    textMuted: '#71716E',

    // ── Semantic ───────────────────────────────
    success500: '#22C55E',
    warning500: '#EAB308',
    error500: '#EF4444',
    info500: '#3B82F6',

    // ── Accent ──────────────────────────────────
    accentPurple: '#A78BFA',
  },

  typography: {
    fontDisplay: 'Inter',
    fontBody: 'Inter',

    size: {
      textxs: 12,
      textsm: 14,
      textbase: 16,
      textlg: 18,
      textxl: 20,
      text2xl: 24,
      text3xl: 30,
      text4xl: 36,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    32: 32,
    40: 40,
    48: 48,
    56: 56,
    64: 64,
    80: 80,
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 8,
    },
  },

  motion: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    // Spring configs for Reanimated / Animated.spring
    spring: {
      damping: 15,
      stiffness: 200,
    },
  },
};

export type Tokens = typeof tokens;
