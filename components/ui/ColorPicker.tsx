// components/ui/ColorPicker.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const PRESET_COLORS = [
  '#3B82F6', '#00D084', '#EF4444', '#A855F7', '#F59E0B', '#14B8A6',
  '#EC4899', '#8B5CF6', '#06B6D4', '#D97706', '#10B981', '#6366F1',
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
  colors?: string[];
}

export const ColorPicker = ({ value, onChange, colors = PRESET_COLORS }: Props) => {
  const { isDark } = useTheme();
  return (
    <View style={S.row}>
      {colors.map((clr) => (
        <Pressable
          key={clr}
          onPress={() => onChange(clr)}
          style={[
            S.dot,
            {
              backgroundColor: clr,
              transform: [{ scale: value === clr ? 1.3 : 1 }],
              borderWidth: value === clr ? 3 : 0,
              borderColor: isDark ? '#FFF' : '#FFF',
            },
          ]}
        />
      ))}
    </View>
  );
};

const S = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dot: { width: 36, height: 36, borderRadius: 18 },
});
