// app/(tabs)/more/habits/[id].tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

// Real current streak: walk back from the newest logged day while done.
function streakFrom(logs: { day: string; done: boolean }[]): number {
  let s = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].done) s += 1;
    else break;
  }
  return s;
}

export default function HabitDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: habits } = useAsync(() => repository.listHabits(), []);
  const habit = habits.find((h) => h.id === id);

  // The heatmap is DATA now — real per-day history from habit_logs.
  const { data: logs } = useAsync(() => repository.listHabitLogs(id ?? '', 91), []);

  if (!habit) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.habits')} accent={c.habits} />
        <EmptyState icon="repeat-outline" title={t('common.empty')} />
      </View>
    );
  }

  // 91-day grid oldest → newest; unlogged days stay neutral.
  const byDay = new Map(logs.map((l) => [l.day, l]));
  const cells = Array.from({ length: 91 }, (_, i) => {
    const day = new Date(Date.now() - (90 - i) * 86_400_000).toISOString().slice(0, 10);
    const log = byDay.get(day);
    if (!log) return c.b1;
    return log.done ? habit.color : habit.color + '30';
  });

  const realStreak = logs.length ? streakFrom(logs) : habit.streak;
  const last7 = logs.slice(-7);
  const rate7 = last7.length
    ? Math.round((last7.filter((l) => l.done).length / 7) * 100)
    : Math.min(Math.round((habit.streak / 7) * 100), 100);

  // Real weekly pattern: which weekday this habit lands most (from logs).
  const dayCounts = new Array(7).fill(0);
  for (const l of logs) if (l.done) dayCounts[new Date(l.day).getDay()] += 1;
  const doneTotal = dayCounts.reduce((a, b) => a + b, 0);
  const bestDay = doneTotal >= 5 ? t(`days.d${dayCounts.indexOf(Math.max(...dayCounts))}`) : null;

  const stats = [
    { val: `${rate7}%`, label: t('habits.rate_7d'), color: habit.color },
    { val: `${realStreak}`, label: t('habits.streak_current'), color: '#F59E0B' },
    { val: `${Math.max(habit.bestStreak, realStreak)}`, label: t('habits.best'), color: c.green },
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
                🔥 {t('habits.streak_days', { n: habit.streak })}
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
        <Text style={[S.secTitle, { color: c.t2 }]}>📅 {t('habits.last_3mo')}</Text>
        <SmartCard>
          <View style={S.heatmap}>
            {cells.map((bg, i) => (
              <View key={i} style={[S.cell, { backgroundColor: bg }]} />
            ))}
          </View>
          <View style={S.legend}>
            <Text style={{ color: c.t3, fontSize: 11 }}>{t('habits.legend_none')}</Text>
            <View style={[S.cell, { backgroundColor: c.b1 }]} />
            <View style={[S.cell, { backgroundColor: habit.color + '30' }]} />
            <View style={[S.cell, { backgroundColor: habit.color }]} />
            <Text style={{ color: c.t3, fontSize: 11 }}>{t('habits.legend_done')}</Text>
          </View>
        </SmartCard>

        {/* Pattern — computed from YOUR real logs (hidden until enough data) */}
        {bestDay && (
          <SmartCard>
            <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>{t('habits.real_pattern')}</Text>
            <Text style={{ color: c.t2, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              {t('habits.pattern_body', { day: bestDay, n: Math.max(...dayCounts) })}
            </Text>
          </SmartCard>
        )}
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
