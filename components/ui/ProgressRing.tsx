// components/ui/ProgressRing.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  progress: number; // 0..1
  size?: number;
  color?: string;
  label?: string;
}

// حلقة تقدم بسيطة (بدون SVG) — تعتمد على حدّ ملوّن
export const ProgressRing = ({ progress, size = 56, color, label }: Props) => {
  const { c } = useTheme();
  const tone = color ?? c.accent;
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: tone + '40',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: tone,
          borderTopColor: progress < 0.25 ? tone + '40' : tone,
          backgroundColor: tone + '12',
        }}
      />
      <Text style={{ fontSize: size * 0.26, fontWeight: '800', color: tone }}>
        {label ?? `${pct}%`}
      </Text>
    </View>
  );
};
