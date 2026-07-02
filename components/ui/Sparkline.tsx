// components/ui/Sparkline.tsx
// Tiny single-series trend mark for stat rows (dataviz rules: one hue — the
// system accent; thin bars, 2px gaps, rounded data-ends; no legend for a
// single series; direction is conveyed by icon + text next to it, never by
// color alone; all text wears text tokens). Views-based — no SVG dependency.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  /** Chronological values (oldest → newest). Renders nothing with < 2 points. */
  data: number[];
  height?: number;
  /** Mark color; defaults to the single system accent. */
  color?: string;
}

export const Sparkline = ({ data, height = 26, color }: Props) => {
  const { c } = useTheme();
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <View style={[S.row, { height }]}>
      {data.map((v, i) => {
        const h = 4 + ((v - min) / range) * (height - 4); // 4px floor so zero stays visible
        return (
          <View
            key={i}
            style={[
              S.bar,
              {
                height: h,
                backgroundColor: color ?? c.accent,
                opacity: i === data.length - 1 ? 1 : 0.55, // newest point reads strongest
              },
            ]}
          />
        );
      })}
    </View>
  );
};

/** Direction of the series for the icon+text delta beside the mark. */
export function trendOf(data: number[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  const half = Math.floor(data.length / 2);
  const a = data.slice(0, half).reduce((s, v) => s + v, 0) / Math.max(half, 1);
  const b = data.slice(half).reduce((s, v) => s + v, 0) / Math.max(data.length - half, 1);
  if (b > a * 1.05) return 'up';
  if (b < a * 0.95) return 'down';
  return 'flat';
}

const S = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { flex: 1, borderRadius: 2, minWidth: 3 },
});
