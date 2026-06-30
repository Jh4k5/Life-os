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
