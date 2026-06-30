// components/ui/StatRow.tsx
// Restrained stat strip — icon + value + label, divided by hairlines.
// Replaces emoji StatChip rows. Numbers use tabular figures (no layout shift).
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface Stat {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}

export const StatRow = ({ stats }: { stats: Stat[] }) => {
  const { c } = useTheme();
  return (
    <View style={S.row}>
      {stats.map((s, i) => (
        <React.Fragment key={`${s.label}-${i}`}>
          {i > 0 && <View style={[S.divider, { backgroundColor: c.b1 }]} />}
          <StatItem stat={s} c={c} />
        </React.Fragment>
      ))}
    </View>
  );
};

const StatItem = ({ stat, c }: { stat: Stat; c: ReturnType<typeof useTheme>['c'] }) => {
  const tone = stat.color ?? c.accent;
  const Body = (
    <View style={S.item}>
      <Ionicons name={stat.icon} size={16} color={tone} />
      <Text style={[S.value, { color: c.t1 }]}>{stat.value}</Text>
      <Text style={[S.label, { color: c.t3 }]} numberOfLines={1}>
        {stat.label}
      </Text>
    </View>
  );
  if (stat.onPress) {
    return (
      <Pressable
        onPress={stat.onPress}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.6 : 1 }]}
      >
        {Body}
      </Pressable>
    );
  }
  return <View style={{ flex: 1 }}>{Body}</View>;
};

const S = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { alignItems: 'center', gap: 3, paddingVertical: 2 },
  value: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  label: { fontSize: 11, fontWeight: '500' },
  divider: { width: StyleSheet.hairlineWidth, height: 34, marginHorizontal: 6 },
});
