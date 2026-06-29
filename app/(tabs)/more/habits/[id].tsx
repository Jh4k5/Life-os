// app/(tabs)/more/habits/[id].tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMockStore } from '@/store/mockStore';

// خريطة حرارية بنمط GitHub — توليد حتمي من معرّف العادة
const buildHeatmap = (seed: string, color: string, base: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells: { level: number }[] = [];
  for (let i = 0; i < 91; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const level = (h % 5) === 0 ? 0 : (h % 4);
    cells.push({ level });
  }
  return cells.map((cell) =>
    cell.level === 0 ? base : color + ['18', '40', '80', 'FF'][cell.level - 1]
  );
};

export default function HabitDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habits = useMockStore((s) => s.habits);
  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.habits')} accent={c.habits} />
        <EmptyState emoji="💎" title={t('common.empty')} />
      </View>
    );
  }

  const cells = buildHeatmap(habit.id, habit.color, c.b1);
  const rate7 = Math.round((habit.streak / 7) * 100) > 100 ? 100 : Math.round((habit.streak / 7) * 100);

  const stats = [
    { val: `${Math.min(rate7, 100)}%`, label: 'معدل 7 أيام', color: habit.color },
    { val: `${habit.streak}`, label: 'streak حالي', color: '#F59E0B' },
    { val: `${habit.bestStreak}`, label: 'أفضل streak', color: c.green },
    { val: `${habit.target}${habit.unit ? ' ' + habit.unit : ''}`, label: t('habits.target'), color: c.accent },
  ];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={habit.name} accent={habit.color} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard accent={habit.color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[S.icon, { backgroundColor: habit.color + '22' }]}>
              <Text style={{ fontSize: 34 }}>{habit.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 18 }}>{habit.name}</Text>
              <Text style={{ color: '#F59E0B', fontWeight: '600', marginTop: 4 }}>
                🔥 {habit.streak} يوم متتالي
              </Text>
            </View>
          </View>
        </SmartCard>

        {/* Stats grid */}
        <View style={S.grid}>
          {stats.map((s, i) => (
            <SmartCard key={i} style={{ flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 12, color: c.t2, marginTop: 4, textAlign: 'center' }}>{s.label}</Text>
            </SmartCard>
          ))}
        </View>

        {/* Heatmap */}
        <Text style={[S.secTitle, { color: c.t2 }]}>📅 آخر 3 أشهر</Text>
        <SmartCard>
          <View style={S.heatmap}>
            {cells.map((bg, i) => (
              <View key={i} style={[S.cell, { backgroundColor: bg }]} />
            ))}
          </View>
          <View style={S.legend}>
            <Text style={{ color: c.t3, fontSize: 11 }}>أقل</Text>
            {['18', '40', '80', 'FF'].map((a) => (
              <View key={a} style={[S.cell, { backgroundColor: habit.color + a }]} />
            ))}
            <Text style={{ color: c.t3, fontSize: 11 }}>أكثر</Text>
          </View>
        </SmartCard>

        {/* AI insight */}
        <SmartCard accent={c.ai_hub}>
          <Text style={{ color: c.ai_hub, fontWeight: '700', fontSize: 13 }}>🤖 رؤية الذكاء</Text>
          <Text style={{ color: c.t2, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            أنت تتفوق في هذه العادة أيام الثلاثاء والخميس. حاول الحفاظ على نفس الإيقاع في عطلة نهاية الأسبوع.
          </Text>
        </SmartCard>
      </ScrollView>
    </View>
  );
}

const CELL = 12;
const S = StyleSheet.create({
  screen: { flex: 1 },
  icon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secTitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cell: { width: CELL, height: CELL, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' },
});
