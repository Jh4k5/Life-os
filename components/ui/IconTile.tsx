// components/ui/IconTile.tsx
// Rounded glyph container — the canonical "icon in a soft tile" used on
// list rows, course/section headers, stat blocks. Ionicons only (no emoji).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  /** tile + glyph accent; defaults to app accent */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  /** filled accent background instead of soft tint */
  solid?: boolean;
}

const DIMS = {
  sm: { box: 36, radius: 11, glyph: 18 },
  md: { box: 44, radius: 13, glyph: 22 },
  lg: { box: 52, radius: 15, glyph: 26 },
};

export const IconTile = ({ icon, color, size = 'md', solid = false }: Props) => {
  const { c } = useTheme();
  const tone = color ?? c.accent;
  const d = DIMS[size];
  return (
    <View
      style={[
        S.tile,
        {
          width: d.box,
          height: d.box,
          borderRadius: d.radius,
          backgroundColor: solid ? tone : tone + '1F',
          borderWidth: solid ? 0 : StyleSheet.hairlineWidth,
          borderColor: tone + '33',
        },
      ]}
    >
      <Ionicons name={icon} size={d.glyph} color={solid ? '#FFF' : tone} />
    </View>
  );
};

const S = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
