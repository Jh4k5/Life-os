// app/(tabs)/more/habits/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { HabitCard } from '@/components/ui/HabitCard';
import { TabPill } from '@/components/ui/TabPill';
import { useMockStore } from '@/store/mockStore';
import { repository } from '@/services/repository';
import { feedback } from '@/services/feedback';

type HView = 'today' | 'all' | 'stats';

export default function HabitsScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const habits = useMockStore((s) => s.habits);
  const updateLocal = useMockStore((s) => s.updateHabit);
  const hydrate = useMockStore((s) => s.hydrate);
  const [view, setView] = useState<HView>('today');

  // Optimistic local update + real habit_logs row (fire-and-forget when live).
  const update = React.useCallback(
    (id: string, val: number, done: boolean) => {
      updateLocal(id, val, done);
      repository.logHabit(id, val, done);
      if (done) feedback.success();
      else feedback.tap();
    },
    [updateLocal]
  );

  // Load real habits from Supabase once (falls back to mock until they arrive).
  React.useEffect(() => {
    let alive = true;
    repository.listHabits().then((list) => {
      if (alive && list.length) hydrate(list);
    });
    return () => {
      alive = false;
    };
  }, [hydrate]);

  const done = habits.filter((h) => h.done).length;
  const total = habits.length;
  const prog = total > 0 ? done / total : 0;

  const byTimePref = (pref: string) => habits.filter((h) => h.timePref === pref && !h.done);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.habits')}
        accent={c.habits}
        right={[
          { icon: 'copy-outline', onPress: () => router.push('/(tabs)/more/habits/templates'), color: c.t2 },
          { icon: 'add', onPress: () => router.push('/(tabs)/more/habits/new'), color: c.accent },
        ]}
      />
      <TabPill
        tabs={[
          { key: 'today', label: t('habits.today'), emoji: '☀' },
          { key: 'all', label: t('habits.all'), emoji: '💎' },
          { key: 'stats', label: t('habits.stats'), emoji: '📊' },
        ]}
        active={view}
        onChange={(v) => setView(v as HView)}
        accent={c.habits}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}>
        {/* ── Today ── */}
        {view === 'today' && (
          <>
            <SmartCard accent={c.habits}>
              <View style={S.progRow}>
                <View>
                  <Text style={[S.progLabel, { color: c.t2 }]}>{t('habits.today')}</Text>
                  <Text style={[S.progValue, { color: c.t1 }]}>
                    {done} / {total} {t('sections.habits')}
                  </Text>
                </View>
                <View style={[S.ringWrap, { borderColor: c.habits + '40' }]}>
                  <View
                    style={[
                      S.ringFill,
                      {
                        backgroundColor: c.habits + '22',
                        borderColor: c.habits,
                        borderTopColor: prog < 0.25 ? c.habits + '22' : c.habits,
                      },
                    ]}
                  />
                  <Text style={[S.ringPct, { color: c.habits }]}>{Math.round(prog * 100)}%</Text>
                </View>
              </View>
              <View style={[S.pBg, { backgroundColor: c.b1 }]}>
                <View style={[S.pFill, { width: `${prog * 100}%`, backgroundColor: c.habits }]} />
              </View>
              {done === total && total > 0 && (
                <Text style={[S.allDone, { color: c.green }]}>{t('habits.all_done')}</Text>
              )}
            </SmartCard>

            {byTimePref('morning').length > 0 && (
              <>
                <Text style={[S.timeLabel, { color: c.t3 }]}>🌅 {t('habits.morning')}</Text>
                {byTimePref('morning').map((h) => (
                  <HabitCard key={h.id} habit={h} onUpdate={update} />
                ))}
              </>
            )}

            {habits
              .filter((h) => !h.done && h.timePref === 'anytime')
              .map((h) => (
                <HabitCard key={h.id} habit={h} onUpdate={update} />
              ))}

            {byTimePref('afternoon').length > 0 && (
              <>
                <Text style={[S.timeLabel, { color: c.t3 }]}>☀ {t('habits.afternoon')}</Text>
                {byTimePref('afternoon').map((h) => (
                  <HabitCard key={h.id} habit={h} onUpdate={update} />
                ))}
              </>
            )}

            {byTimePref('evening').length > 0 && (
              <>
                <Text style={[S.timeLabel, { color: c.t3 }]}>🌙 {t('habits.evening')}</Text>
                {byTimePref('evening').map((h) => (
                  <HabitCard key={h.id} habit={h} onUpdate={update} />
                ))}
              </>
            )}

            {habits.filter((h) => h.done).length > 0 && (
              <>
                <Text style={[S.timeLabel, { color: c.green }]}>✅ {t('study.completed')}</Text>
                {habits
                  .filter((h) => h.done)
                  .map((h) => (
                    <HabitCard key={h.id} habit={h} onUpdate={update} />
                  ))}
              </>
            )}
          </>
        )}

        {/* ── All ── */}
        {view === 'all' &&
          habits.map((h) => (
            <Pressable key={h.id} onPress={() => router.push(`/(tabs)/more/habits/${h.id}`)}>
              <SmartCard accent={h.color}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: h.color + '22',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{h.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }}>{h.name}</Text>
                    <Text style={{ color: c.t2, fontSize: 12, marginTop: 3 }}>
                      {h.type === 'checkbox'
                        ? '☑ صح/خطأ'
                        : h.type === 'counter'
                          ? `🔢 ${h.target} ${h.unit ?? ''}`
                          : h.type === 'timer'
                            ? `⏱ ${h.target} دقيقة`
                            : h.type === 'stopwatch'
                              ? '⏱ كرونومتر'
                              : `📏 ${h.target} ${h.unit ?? ''}`}
                      {' · '}
                      {h.freq === 'daily'
                        ? t('habits.daily')
                        : h.freq === 'weekly'
                          ? t('habits.weekly')
                          : t('habits.monthly')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>🔥 {h.streak}</Text>
                    <Ionicons name="chevron-forward" size={16} color={c.t3} />
                  </View>
                </View>
              </SmartCard>
            </Pressable>
          ))}

        {/* ── Stats ── */}
        {view === 'stats' && (
          <>
            <View style={S.statsGrid}>
              {[
                {
                  val: `${Math.round((habits.reduce((s, h) => s + (h.done ? 1 : 0), 0) / Math.max(habits.length, 1)) * 100)}%`,
                  label: 'معدل إكمال اليوم',
                  color: c.habits,
                },
                { val: `${Math.max(...habits.map((h) => h.streak))}`, label: 'أعلى streak حالي', color: '#F59E0B' },
                { val: `${Math.max(...habits.map((h) => h.bestStreak))}`, label: 'أفضل streak تاريخياً', color: c.green },
                { val: `${habits.length}`, label: 'إجمالي العادات', color: c.accent },
              ].map((stat, i) => (
                <SmartCard key={i} style={{ flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 18 }}>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: stat.color }}>{stat.val}</Text>
                  <Text style={{ fontSize: 12, color: c.t2, textAlign: 'center', marginTop: 4 }}>{stat.label}</Text>
                </SmartCard>
              ))}
            </View>
            <SmartCard>
              {habits.map((h, i) => (
                <View
                  key={h.id}
                  style={[
                    S.statRow,
                    i > 0 && { borderTopColor: c.b0, borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                  <Text style={{ color: c.t1, fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <View style={[S.pBg, { width: 80, backgroundColor: c.b1 }]}>
                    <View style={[S.pFill, { width: `${Math.min(h.streak / 30, 1) * 100}%`, backgroundColor: h.color }]} />
                  </View>
                  <Text style={{ color: h.color, fontWeight: '700', minWidth: 36, textAlign: 'right' }}>
                    {h.streak} 🔥
                  </Text>
                </View>
              ))}
            </SmartCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  progRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progLabel: { fontSize: 13, fontWeight: '500' },
  progValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  ringWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 3 },
  ringPct: { fontSize: 14, fontWeight: '800' },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  allDone: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  timeLabel: { fontSize: 13, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
