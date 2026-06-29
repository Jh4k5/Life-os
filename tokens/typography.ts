// tokens/typography.ts
export const typography = {
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  // معاملات حجم الخط (للإعدادات: صغير / متوسط / كبير)
  scale: {
    sm: 0.9,
    md: 1,
    lg: 1.12,
    xl: 1.25,
  },
};
