/**
 * KAIRO — "The AI Economic Identity Network"
 * ============================================
 * Design System: Color Tokens, Typography, Spacing & Shadows
 *
 * Primary Palette: White & Gold
 * Mode: Light-first (white bg) with a premium dark alternative
 *
 * Usage:
 *   import { Colors, Typography, Spacing, Shadows, Radius } from '@/constants/theme';
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// RAW PALETTE
// ─────────────────────────────────────────────

export const Palette = {
  // Gold family
  gold: {
    50:  '#FFFDF0',   // whisper gold — barely-there tints
    100: '#FEF9D7',   // champagne
    200: '#FDF0A0',   // pale gold
    300: '#FAE062',   // soft gold
    400: '#F5C518',   // bright gold (primary accent)
    500: '#D4A017',   // rich gold (default action colour)
    600: '#B8860B',   // dark goldenrod
    700: '#9A6F08',   // deep gold
    800: '#7A5506',   // dark amber
    900: '#5C3D04',   // near-black gold
  },

  // White / neutral family
  white: {
    pure:    '#FFFFFF',
    offWhite:'#FAFAF8',   // warm off-white — primary background
    pearl:   '#F5F4F0',   // pearl — card surfaces
    mist:    '#EEEDE8',   // light dividers
    smoke:   '#E2E0D8',   // borders
    ash:     '#C8C5BB',   // muted text support
  },

  // Dark neutrals (for text, icons, dark-mode surfaces)
  dark: {
    900: '#0D0D0D',   // near black
    800: '#1A1A1A',   // card bg (dark mode)
    700: '#262626',
    600: '#333333',
    500: '#4D4D4D',   // secondary text (dark mode)
    400: '#666666',   // muted text
    300: '#999999',
    200: '#BBBBBB',
    100: '#DDDDDD',
  },

  // Semantic status colours
  status: {
    successGreen:  '#22C55E',
    warningAmber:  '#F59E0B',
    errorRed:      '#EF4444',
    infoBlue:      '#3B82F6',
    trustPurple:   '#8B5CF6',   // Trust Score accent
  },

  transparent: 'transparent',
} as const;

// ─────────────────────────────────────────────
// SEMANTIC COLOR TOKENS
// ─────────────────────────────────────────────

export const Colors = {

  /** Light theme — primary experience */
  light: {
    // Backgrounds
    background:           Palette.white.offWhite,
    backgroundCard:       Palette.white.pearl,
    backgroundElevated:   Palette.white.pure,
    backgroundOverlay:    'rgba(0,0,0,0.40)',

    // Text
    textPrimary:          Palette.dark[900],
    textSecondary:        Palette.dark[500],
    textMuted:            Palette.dark[300],
    textOnGold:           Palette.dark[900],   // text placed on gold bg
    textOnDark:           Palette.white.pure,

    // Brand / Accent
    brand:                Palette.gold[500],   // main CTA colour
    brandLight:           Palette.gold[100],
    brandDark:            Palette.gold[700],
    brandGlow:            'rgba(212,160,23,0.20)',

    // Tint (tab bar, icons)
    tint:                 Palette.gold[500],
    tabIconDefault:       Palette.dark[300],
    tabIconSelected:      Palette.gold[500],

    // UI Chrome
    border:               Palette.white.smoke,
    divider:              Palette.white.mist,
    icon:                 Palette.dark[400],
    placeholder:          Palette.dark[200],
    inputBackground:      Palette.white.pure,
    inputBorder:          Palette.white.smoke,
    inputBorderFocus:     Palette.gold[500],

    // Status
    success:              Palette.status.successGreen,
    warning:              Palette.status.warningAmber,
    error:                Palette.status.errorRed,
    info:                 Palette.status.infoBlue,
    trustScore:           Palette.status.trustPurple,

    // Special — Trust Score gradient endpoints
    trustGradientStart:   Palette.gold[400],
    trustGradientEnd:     Palette.gold[700],

    // Shadows (use with Shadows tokens)
    shadowColor:          Palette.dark[900],
  },

  /** Dark theme — optional premium dark mode */
  dark: {
    // Backgrounds
    background:           Palette.dark[900],
    backgroundCard:       Palette.dark[800],
    backgroundElevated:   Palette.dark[700],
    backgroundOverlay:    'rgba(0,0,0,0.65)',

    // Text
    textPrimary:          Palette.white.pure,
    textSecondary:        Palette.dark[100],
    textMuted:            Palette.dark[300],
    textOnGold:           Palette.dark[900],
    textOnDark:           Palette.white.pure,

    // Brand / Accent
    brand:                Palette.gold[400],
    brandLight:           Palette.gold[900],
    brandDark:            Palette.gold[300],
    brandGlow:            'rgba(245,197,24,0.15)',

    // Tint
    tint:                 Palette.gold[400],
    tabIconDefault:       Palette.dark[400],
    tabIconSelected:      Palette.gold[400],

    // UI Chrome
    border:               Palette.dark[600],
    divider:              Palette.dark[700],
    icon:                 Palette.dark[200],
    placeholder:          Palette.dark[400],
    inputBackground:      Palette.dark[800],
    inputBorder:          Palette.dark[600],
    inputBorderFocus:     Palette.gold[400],

    // Status
    success:              Palette.status.successGreen,
    warning:              Palette.status.warningAmber,
    error:                Palette.status.errorRed,
    info:                 Palette.status.infoBlue,
    trustScore:           Palette.status.trustPurple,

    trustGradientStart:   Palette.gold[400],
    trustGradientEnd:     Palette.gold[600],

    shadowColor:          '#000000',
  },
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const Typography = {
  fonts: Platform.select({
    ios: {
      sans:    'system-ui',
      serif:   'ui-serif',
      mono:    'ui-monospace',
    },
    android: {
      sans:    'Roboto',
      serif:   'serif',
      mono:    'monospace',
    },
    web: {
      sans:    "'Inter', 'Outfit', system-ui, -apple-system, sans-serif",
      serif:   "'Playfair Display', Georgia, serif",
      mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    default: {
      sans:    'normal',
      serif:   'serif',
      mono:    'monospace',
    },
  }),

  // Scale (sp for React Native, rem-equivalent for reference)
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },

  weight: {
    regular:    '400' as const,
    medium:     '500' as const,
    semibold:   '600' as const,
    bold:       '700' as const,
    extrabold:  '800' as const,
  },

  lineHeight: {
    tight:   1.2,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
    loose:   2,
  },

  letterSpacing: {
    tight:   -0.5,
    normal:   0,
    wide:     0.5,
    wider:    1,
    widest:   2,
  },
} as const;

// ─────────────────────────────────────────────
// SPACING (4-pt base grid)
// ─────────────────────────────────────────────

export const Spacing = {
  px:   1,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  10:   40,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
  32:  128,
} as const;

// ─────────────────────────────────────────────
// BORDER RADII
// ─────────────────────────────────────────────

export const Radius = {
  none:  0,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  '2xl': 32,
  full:  9999,
} as const;

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────

export const Shadows = {
  /** Subtle lift for cards */
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  /** Default card shadow */
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     5,
  },
  /** Elevated modals / toasts */
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  20,
    elevation:     10,
  },
  /** Gold glow — Trust Score highlights */
  gold: {
    shadowColor:   Palette.gold[500],
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  16,
    elevation:     8,
  },
} as const;

// ─────────────────────────────────────────────
// GRADIENT PRESETS (for expo-linear-gradient)
// ─────────────────────────────────────────────

export const Gradients = {
  /** Hero / onboarding banner */
  goldHorizontal: {
    colors: [Palette.gold[400], Palette.gold[600]] as const,
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 0 },
  },
  /** Trust Score ring */
  goldDiagonal: {
    colors: [Palette.gold[300], Palette.gold[600]] as const,
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
  /** Subtle card shimmer */
  warmWhite: {
    colors: [Palette.white.pure, Palette.white.pearl] as const,
    start:  { x: 0, y: 0 },
    end:    { x: 0, y: 1 },
  },
  /** Dark-mode hero */
  darkGold: {
    colors: [Palette.dark[900], Palette.gold[900]] as const,
    start:  { x: 0, y: 0 },
    end:    { x: 1, y: 1 },
  },
} as const;

// ─────────────────────────────────────────────
// ANIMATION DURATIONS (ms)
// ─────────────────────────────────────────────

export const Duration = {
  instant: 100,
  fast:    200,
  normal:  300,
  slow:    500,
  xslow:   800,
} as const;
