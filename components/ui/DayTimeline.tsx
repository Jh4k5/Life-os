// components/ui/DayTimeline.tsx
// The dashboard is a calm vertical timeline of today — not a card grid.
// Time on the leading edge (RTL-aware), each block with a quiet progress bar.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';

interface Block {
  time: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number; // 0..1
  done?: boolean;
}

const TODAY: Block[] = [
  { time: '٠٨:٠٠', title: 'تعلم الصينية', icon: 'language-outline', progress: 1, done: true },
  { time: '١١:٠٠', title: 'مراجعة الفصل الأول', icon: 'document-text-outline', progress: 0.6 },
  { time: '١٤:٠٠', title: 'جلسة مذاكرة — الكيمياء', icon: 'school-outline', progress: 0.3 },
  { time: '١٦:٠٠', title: 'تمرين', icon: 'barbell-outline', progress: 0 },
  { time: '٢١:٠٠', title: 'قراءة قبل النوم', icon: 'book-outline', progress: 0 },
];

export const DayTimeline = () => {
  const { c } = useTheme();
  const { rowDir } = useRTL();
  const now = 2; // current block index (mock "now" marker)

  return (
    <View style={{ gap: 0 }}>
      {TODAY.map((b, i) => {
        const isNow = i === now;
        return (
          <View key={i} style={[S.row, { flexDirection: rowDir }]}>
            {/* time + rail */}
            <View style={S.timeCol}>
              <Text style={[S.time, { color: isNow ? c.accent : c.t3 }]}>{b.time}</Text>
            </View>
            <View style={S.railCol}>
              <View
                style={[
                  S.node,
                  {
                    backgroundColor: b.done ? c.accent : isNow ? c.bg0 : c.bg2,
                    borderColor: isNow ? c.accent : b.done ? c.accent : c.b2,
                  },
                ]}
              >
                {b.done && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              {i < TODAY.length - 1 && <View style={[S.rail, { backgroundColor: c.b1 }]} />}
            </View>
            {/* content */}
            <View style={[S.card, { backgroundColor: c.bg1, borderColor: isNow ? c.accent + '55' : c.b1 }]}>
              <View style={[S.cardTop, { flexDirection: rowDir }]}>
                <Ionicons name={b.icon} size={16} color={c.t2} />
                <Text style={[S.title, { color: c.t1 }]} numberOfLines={1}>
                  {b.title}
                </Text>
                {b.done && <Text style={{ color: c.green, fontSize: 11, fontWeight: '600' }}>تم</Text>}
              </View>
              {!b.done && (
                <View style={[S.pBg, { backgroundColor: c.b1 }]}>
                  <View style={[S.pFill, { width: `${b.progress * 100}%`, backgroundColor: c.accent }]} />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const S = StyleSheet.create({
  row: { gap: 10, minHeight: 64 },
  timeCol: { width: 46, paddingTop: 2 },
  time: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  railCol: { alignItems: 'center', width: 16 },
  node: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 2, flex: 1, marginVertical: 2 },
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8 },
  cardTop: { alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '600', flex: 1 },
  pBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 5, borderRadius: 3 },
});
