/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the admin dashboard
 */

// Brand Colors
export const COLORS = {
  // Primary Brand
  brandPurple: '#7B2CBF',
  brandSlate: '#1F2937',
  brandMuted: '#6B7280',
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background Colors
  background: '#FFF8E7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status Colors
  active: '#10B981',
  inactive: '#F59E0B',
  pending: '#F59E0B',
} as const

// Spacing Scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

// Elevation (for shadows)
export const ELEVATION = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
} as const

// Typography
export const TYPOGRAPHY = {
  // Font Weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Font Sizes (in pixels for React Native)
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
} as const

// Card Styles
export const CARD_STYLES = {
  default: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.sm,
    padding: SPACING.lg,
  },
  elevated: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.md,
    padding: SPACING.lg,
  },
} as const

// Stat Card Background Tints
export const STAT_CARD_BACKGROUNDS = {
  blue: '#EEF2FF',
  green: '#D1FAE5',
  purple: '#F3E8FF',
  amber: '#FEF3C7',
  red: '#FEE2E2',
  pink: '#FFE4E6',
} as const

// Stat Card Icon Colors
export const STAT_CARD_ICON_COLORS = {
  blue: '#6366F1',
  green: '#10B981',
  purple: '#7B2CBF',
  amber: '#F59E0B',
  red: '#EF4444',
  pink: '#DB2777',
} as const

