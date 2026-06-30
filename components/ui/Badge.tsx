// components/ui/Badge.tsx
// Status / meta badge — soft tinted pill with optional Ionicon.
// Replaces emoji status chips (🟢 جارية / ✅ مكتملة …).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

type Tone = 'accent' | 'neutral' | 'green' | 'red' | 'yellow' | 'blue' | 'orange';

interface Props {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** explicit color override (e.g. per-Area accent) */
  color?: string;
  size?: 'sm' | 'md';
}

export const Badge = ({ label, tone = 'neutral', icon, color, size = 'md' }: Props) => {
  const { c } = useTheme();
  const map: Record<Tone, { fg: string; bg: string }> = {
    accent: { fg: c.accent, bg: c.accentDim },
    neutral: { fg: c.t2, bg: c.b1 },
    green: { fg: c.green, bg: c.greenDim },
    red: { fg: c.red, bg: c.redDim },
    yellow: { fg: c.yellow, bg: c.yellowDim },
    blue: { fg: c.blue, bg: c.blueDim },
    orange: { fg: c.orange, bg: c.orangeDim },
  };
  const fg = color ?? map[tone].fg;
  const bg = color ? color + '22' : map[tone].bg;
  const sm = size === 'sm';

  return (
    <View
      style={[
        S.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: sm ? 8 : 10,
          paddingVertical: sm ? 3 : 5,
          borderRadius: sm ? 8 : 999,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={sm ? 11 : 13} color={fg} />}
      <Text style={[S.txt, { color: fg, fontSize: sm ? 11 : 12.5 }]}>{label}</Text>
    </View>
  );
};

const S = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  txt: { fontWeight: '600' },
});
