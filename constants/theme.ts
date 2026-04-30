// PlayArena Design System
export const Colors = {
  // Backgrounds
  bgPrimary: '#080C10',
  bgSecondary: '#0D1117',
  bgCard: '#111820',
  bgGlass: 'rgba(255,255,255,0.06)',
  bgGlassBorder: 'rgba(255,255,255,0.12)',

  // Neon Accents
  neonGreen: '#00FF88',
  neonGreenDim: '#00CC6A',
  neonGreenGlow: 'rgba(0,255,136,0.25)',
  electricBlue: '#00BFFF',
  electricBlueDim: '#0099CC',
  electricBlueGlow: 'rgba(0,191,255,0.25)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0ADB8',
  textMuted: '#4A5568',
  textAccent: '#00FF88',

  // UI Elements
  border: 'rgba(255,255,255,0.1)',
  borderAccent: 'rgba(0,255,136,0.4)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputBorderFocus: 'rgba(0,255,136,0.6)',

  // Semantic
  error: '#FF4757',
  success: '#00FF88',
  warning: '#FFB800',

  // Gradients (use with LinearGradient)
  gradientPrimary: ['#00FF88', '#00BFFF'] as string[],
  gradientDark: ['#080C10', '#0D1117'] as string[],
  gradientCard: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as string[],
  gradientNeon: ['rgba(0,255,136,0.3)', 'rgba(0,191,255,0.1)'] as string[],
  gradientOverlay: ['rgba(8,12,16,0)', 'rgba(8,12,16,0.95)'] as string[],
};

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
    display: 48,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const Shadow = {
  neonGreen: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  electricBlue: {
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
};
