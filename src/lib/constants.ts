// src/lib/constants.ts

export const Colors = {
  // Backgrounds
  bg: '#0d0d0d',
  bgCard: '#1a1a1a',
  bgCardBorder: '#2a2a2a',
  bgHighlight: '#431407',

  // Accents
  primary: '#f97316',        // orange
  secondary: '#ef4444',      // red
  primaryDim: '#f9731640',   // orange 25% opacity

  // Text
  textPrimary: '#f1f1f1',
  textSecondary: '#9ca3af',
  textMuted: '#666666',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#a855f7',

  // Gradient endpoints
  gradientStart: '#f97316',
  gradientEnd: '#ef4444',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FontSize = {
  xs: 9,
  sm: 11,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
} as const;

export const FontWeight = {
  normal: '400',
  medium: '600',
  bold: '700',
  heavy: '800',
} as const;
