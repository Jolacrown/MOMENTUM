export const darkTokens = {
  colors: {
    primary50: '#FFF7ED',
    primary100: '#FFEDD5',
    primary200: '#FED7AA',
    primary300: '#FDBA74',
    primary400: '#FB923C',
    primary500: '#F97316',
    primary600: '#EA580C',
    primary700: '#C2410C',
    primary800: '#9A3412',
    primary900: '#7C2D12',

    // ── Neutrals (Dark Mode) ──────────
    bgBase: '#0F0F10',
    bgSurface: '#1A1A1C',
    bgElevated: '#242426',
    borderBase: 'rgba(255, 255, 255, 0.06)',
    borderLight: 'rgba(255, 255, 255, 0.03)',

    textPrimary: '#F5F5F0',
    textSecondary: '#A0A09A',
    textMuted: '#5A5A55',

    // ── Semantic ───────────────────────────────
    success50: '#F0FDF4',
    success500: '#22C55E',
    warning50: '#FEFCE8',
    warning500: '#EAB308',
    error50: '#FEF2F2',
    error500: '#EF4444',
    info50: '#EFF6FF',
    info500: '#3B82F6',

    outlineVariant: 'rgba(255, 255, 255, 0.10)',
    accentPurple: '#A78BFA',
  },
  typography: {
    fontDisplay: 'Sora',
    fontBody: 'PlusJakartaSans',
    size: { textxs: 12, textsm: 14, textbase: 16, textlg: 18, textxl: 20, text2xl: 24, text3xl: 30, text4xl: 36 },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
  },
  spacing: { 2: 2, 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 14: 14, 16: 16, 20: 20, 24: 24, 28: 28, 32: 32, 40: 40, 48: 48, 56: 56, 64: 64, 80: 80, 100: 100 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  },
  motion: { duration: { fast: 150, normal: 300, slow: 500 }, spring: { damping: 15, stiffness: 200 } },
};

export const tokens = {
  colors: {
    primary50: '#FFF7ED',
    primary100: '#FFEDD5',
    primary200: '#FED7AA',
    primary300: '#FDBA74',
    primary400: '#FB923C',
    primary500: '#F97316',
    primary600: '#EA580C',
    primary700: '#C2410C',
    primary800: '#9A3412',
    primary900: '#7C2D12',

    // ── Neutrals (Light Mode) ──────────
    bgBase: '#F5F5F0',
    bgSurface: '#FFFFFF',
    bgElevated: '#FAFAF8',
    borderBase: 'rgba(0, 0, 0, 0.06)',
    borderLight: 'rgba(0, 0, 0, 0.03)',

    textPrimary: '#1A1A18',
    textSecondary: '#6B6B66',
    textMuted: '#A0A09A',

    // ── Semantic ───────────────────────────────
    success50: '#F0FDF4',
    success500: '#22C55E',
    warning50: '#FEFCE8',
    warning500: '#EAB308',
    error50: '#FEF2F2',
    error500: '#EF4444',
    info50: '#EFF6FF',
    info500: '#3B82F6',

    // ── Input ──────────────────────────────────
    outlineVariant: 'rgba(0, 0, 0, 0.10)',

    // ── Accent ──────────────────────────────────
    accentPurple: '#A78BFA',
  },

  typography: {
    fontDisplay: 'Sora',
    fontBody: 'PlusJakartaSans',

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
    2: 2,
    4: 4,
    6: 6,
    8: 8,
    10: 10,
    12: 12,
    14: 14,
    16: 16,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    40: 40,
    48: 48,
    56: 56,
    64: 64,
    80: 80,
    100: 100,
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
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  motion: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    spring: {
      damping: 15,
      stiffness: 200,
    },
  },
};

export type Tokens = typeof tokens;
export type DarkTokens = typeof darkTokens;
