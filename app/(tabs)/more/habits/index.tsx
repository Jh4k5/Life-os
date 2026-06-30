// app/(tabs)/more/habits/index.tsx
// Habits — rebuilt on the design system (ui-ux-pro-max).
// Ionicons (no emoji), token colors, ProgressRing/Bar primitives, i18n, RTL.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard, ProgressRing, ProgressBar, IconTile, Badge, TabPill } from '@/components/ui';
import { HabitCard, type HabitData } from '@/components/ui/HabitCard';
import { useMockStore } from '@/store/mockStore';
import { repository } from '@/services/repository';

type HView = 'today' | 'all' | 'stats';

const TYPE_ICON: Record<HabitData['type'], keyof typeof Ionicons.glyphMap> = {
  checkbox: 'checkmark-done-outline',
  counter: 'repeat-outline',
  quantity: 'flask-outline',
  timer: 'timer-outline',
  stopwatch: 'stopwatch-outline',
};

const TIME_GROUPS: { key: string; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { key: 'morning', icon: 'partly-sunny-outline', labelKey: 'habits.morning' },
  { key: 'afternoon', icon: 'sunny-outline', labelKey: 'habits.afternoon' },
  { key: 'evening', icon: 'moon-outline', labelKey: 'habits.evening' },
];

export default function HabitsScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const habits = useMockStore((s) => s.habits);
  const update = useMockStore((s) => s.updateHabit);
  const hydrate = useMockStore((s) => s.hydrate);
  const [view, setView] = useState<HView>('today');

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
  const anytime = habits.filter((h) => !h.done && h.timePref === 'anytime');
  const completed = habits.filter((h) => h.done);

  const typeLabel: Record<HabitData['type'], string> = {
    checkbox: t('habits.t_check'),
    counter: t('habits.t_counter'),
    quantity: t('habits.t_qty'),
    timer: t('habits.t_timer'),
    stopwatch: t('habits.t_stop'),
  };
  const freqLabel = (f?: string) =>
    f === 'weekly' ? t('habits.weekly') : f === 'monthly' ? t('habits.monthly') : t('habits.daily');

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.habits')}
        right={[
          { icon: 'copy-outline', onPress: () => router.push('/(tabs)/more/habits/templates'), color: c.t2 },
          { icon: 'add', onPress: () => router.push('/(tabs)/more/habits/new'), color: c.accent },
        ]}
      />
      <TabPill
        tabs={[
          { key: 'today', label: t('habits.today'), icon: 'today-outline' },
          { key: 'all', label: t('habits.all'), icon: 'apps-outline' },
          { key: 'stats', label: t('habits.stats'), icon: 'stats-chart-outline' },
        ]}
        active={view}
        onChange={(v) => setView(v as HView)}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* ── Today ── */}
        {view === 'today' && (
          <>
            <SmartCard>
              <View style={[S.progRow, { flexDirection: rowDir }]}>
                <View>
                  <Text style={[S.progLabel, { color: c.t2, textAlign }]}>{t('habits.today')}</Text>
                  <Text style={[S.progValue, { color: c.t1, textAlign }]}>
                    {t('habits.done_count', { n: done, total })}
                  </Text>
                </View>
                <ProgressRing progress={prog} size={56} />
              </View>
              <View style={{ marginTop: 12 }}>
                <ProgressBar progress={prog} />
              </View>
              {done === total && total > 0 && (
                <View style={[S.allDoneRow, { flexDirection: rowDir }]}>
                  <Ionicons name="checkmark-circle" size={15} color={c.green} />
                  <Text style={[S.allDone, { color: c.green }]}>{t('habits.all_done')}</Text>
                </View>
              )}
            </SmartCard>

            {TIME_GROUPS.map((g) =>
              byTimePref(g.key).length > 0 ? (
                <View key={g.key}>
                  <TimeLabel icon={g.icon} label={t(g.labelKey)} color={c.t3} rowDir={rowDir} />
                  {byTimePref(g.key).map((h) => (
                    <HabitCard key={h.id} habit={h} onUpdate={update} />
                  ))}
                </View>
              ) : null,
            )}

            {anytime.map((h) => (
              <HabitCard key={h.id} habit={h} onUpdate={update} />
            ))}

            {completed.length > 0 && (
              <View>
                <TimeLabel icon="checkmark-done" label={t('habits.done')} color={c.green} rowDir={rowDir} />
                {completed.map((h) => (
                  <HabitCard key={h.id} habit={h} onUpdate={update} />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── All ── */}
        {view === 'all' &&
          habits.map((h) => (
            <Pressable key={h.id} onPress={() => router.push(`/(tabs)/more/habits/${h.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <SmartCard>
                <View style={[S.allRow, { flexDirection: rowDir }]}>
                  <IconTile icon={TYPE_ICON[h.type]} size="md" color={h.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, textAlign }}>{h.name}</Text>
                    <Text style={{ color: c.t2, fontSize: 12, marginTop: 3, textAlign }}>
                      {typeLabel[h.type]}
                      {h.target ? ` · ${h.target}${h.unit ? ' ' + h.unit : ''}` : ''}
                      {' · '}
                      {freqLabel(h.freq)}
                    </Text>
                  </View>
                  {h.streak > 0 && <Badge label={t('habits.streak', { n: h.streak })} icon="flame" tone="orange" size="sm" />}
                  <Ionicons name={rowDir === 'row-reverse' ? 'chevron-back' : 'chevron-forward'} size={16} color={c.t3} />
                </View>
              </SmartCard>
            </Pressable>
          ))}

        {/* ── Stats ── */}
        {view === 'stats' && habits.length > 0 && (
          <>
            <View style={S.statsGrid}>
              <StatTile value={`${Math.round(prog * 100)}%`} label={t('habits.stat_today')} color={c.accent} c={c} />
              <StatTile value={Math.max(...habits.map((h) => h.streak))} label={t('habits.stat_streak')} color={c.orange} c={c} />
              <StatTile value={Math.max(...habits.map((h) => h.bestStreak))} label={t('habits.stat_best')} color={c.green} c={c} />
              <StatTile value={habits.length} label={t('habits.stat_total')} color={c.accent} c={c} />
            </View>
            <SmartCard>
              {habits.map((h, i) => (
                <View
                  key={h.id}
                  style={[
                    S.statRow,
                    { flexDirection: rowDir },
                    i > 0 && { borderTopColor: c.b0, borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <IconTile icon={TYPE_ICON[h.type]} size="sm" color={h.color} />
                  <Text style={{ color: c.t1, fontSize: 14, flex: 1, textAlign }} numberOfLines={1}>
                    {h.name}
                  </Text>
                  <View style={{ width: 80 }}>
                    <ProgressBar progress={Math.min(h.streak / 30, 1)} color={h.color} height={5} />
                  </View>
                  <Badge label={t('habits.streak', { n: h.streak })} icon="flame" tone="orange" size="sm" />
                </View>
              ))}
            </SmartCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const TimeLabel = ({
  icon,
  label,
  color,
  rowDir,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  rowDir: 'row' | 'row-reverse';
}) => (
  <View style={[S.timeLabelRow, { flexDirection: rowDir }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[S.timeLabel, { color }]}>{label}</Text>
  </View>
);

const StatTile = ({
  value,
  label,
  color,
  c,
}: {
  value: string | number;
  label: string;
  color: string;
  c: ReturnType<typeof useTheme>['c'];
}) => (
  <SmartCard style={{ flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 18 }}>
    <Text style={{ fontSize: 28, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>{value}</Text>
    <Text style={{ fontSize: 12, color: c.t2, textAlign: 'center', marginTop: 4 }}>{label}</Text>
  </SmartCard>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  progRow: { justifyContent: 'space-between', alignItems: 'center' },
  progLabel: { fontSize: 13, fontWeight: '500' },
  progValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  allDoneRow: { alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  allDone: { fontSize: 14, fontWeight: '600' },
  timeLabelRow: { alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 },
  timeLabel: { fontSize: 13, fontWeight: '700' },
  allRow: { alignItems: 'center', gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statRow: { alignItems: 'center', gap: 10, paddingVertical: 10 },
});
