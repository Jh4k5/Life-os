// tokens/typography.ts
// Strong, confident hierarchy — typography does the heavy lifting.
import { Platform } from 'react-native';

// Latin: SF Pro / Inter · Arabic: SF Arabic / system fallback.
// (System fonts render the Arabic deliberately on iOS/Android; a bundled
//  IBM Plex Sans Arabic can be dropped in later via expo-font.)
export const fontFamily = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  display: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
};

export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
    '4xl': 42,
    hero: 52,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  // Tight, intentional line-height on headings
  leading: {
    tight: 1.05,
    snug: 1.2,
    normal: 1.45,
  },
  tracking: {
    tight: -0.8,
    snug: -0.4,
    normal: 0,
  },
  scale: { sm: 0.92, md: 1, lg: 1.1, xl: 1.22 },
};

// ── Precision type roles (ui-ux-pro-max "Modern Dark Cinema" system) ──
// One authoritative scale: role → size/weight/tracking/leading, so every
// screen speaks the same typographic language. Tracking is kept gentler than
// the pure-Latin spec because the app is Arabic-first (aggressive negative
// tracking cramps Arabic); numerals use tabular figures to avoid layout shift.
export const type = {
  /** Big moments — the Home greeting, hero numbers. */
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 38 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 32 },
  h2: { fontSize: 21, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 27 },
  title: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 23 },
  body: { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 22 },
  callout: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 20 },
  /** Eyebrow / section labels — small, confident, slightly loosened. */
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.4, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 15 },
  /** Numeric figures (timers, counts) — no width jitter. */
  numeric: { fontVariant: ['tabular-nums'] as ['tabular-nums'] },
};
