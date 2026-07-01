// app/(tabs)/more/exercise/index.tsx
// Exercise — v3 premium. Repo-backed workout history, gym/home modes, weekly
// volume, and per-workout exercise breakdown. Monochrome, single accent.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockWorkouts } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

export default function ExerciseScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const [mode, setMode] = useState<'all' | 'gym' | 'home'>('all');
  const { data: workouts } = useAsync(() => repository.listWorkouts(), mockWorkouts);

  const filtered = workouts.filter((w) => mode === 'all' || w.mode === mode);
  const weekMinutes = workouts.reduce((s, w) => s + w.durationMin, 0);
  const weekSets = workouts.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.sets, 0), 0);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.exercise')}
        right={[{ icon: 'add', onPress: () => {}, color: c.accent }]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <SmartCard>
              <View style={[S.stats, { flexDirection: rowDir }]}>
                <Stat icon="time-outline" val={`${weekMinutes}m`} label={t('exercise.this_week')} c={c} />
                <View style={[S.divider, { backgroundColor: c.b1 }]} />
                <Stat icon="layers-outline" val={weekSets} label={t('exercise.sets')} c={c} />
                <View style={[S.divider, { backgroundColor: c.b1 }]} />
                <Stat icon="flame-outline" val={workouts.length} label={t('exercise.workouts')} c={c} />
              </View>
            </SmartCard>
            <View style={[S.modeRow, { flexDirection: rowDir }]}>
              {(['all', 'gym', 'home'] as const).map((m) => {
                const on = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[S.modeChip, { backgroundColor: on ? c.accent : c.bg2, borderColor: on ? c.accent : c.b1 }]}
                  >
                    <Text style={{ color: on ? '#FFF' : c.t2, fontWeight: '600', fontSize: 13 }}>
                      {t(`exercise.mode_${m}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item: w }) => (
          <SmartCard>
            <View style={[S.head, { flexDirection: rowDir }]}>
              <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                <Ionicons name={w.mode === 'gym' ? 'barbell-outline' : 'home-outline'} size={20} color={c.t1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontSize: 15, fontWeight: '700', textAlign }} numberOfLines={1}>
                  {w.name}
                </Text>
                <Text style={{ color: c.t3, fontSize: 12, textAlign, marginTop: 2 }}>
                  {w.durationMin} {t('exercise.min')} · {w.exercises.length} {t('exercise.exercises')}
                </Text>
              </View>
              <View style={[S.modeTag, { backgroundColor: c.bg3 }]}>
                <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>{t(`exercise.mode_${w.mode}`)}</Text>
              </View>
            </View>
            {w.exercises.map((e, i) => (
              <View key={i} style={[S.exRow, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                <Ionicons name="ellipse" size={6} color={c.accent} />
                <Text style={{ color: c.t1, flex: 1, fontSize: 13, textAlign }} numberOfLines={1}>
                  {e.name}
                </Text>
                <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                  {e.sets}×{e.reps}
                  {e.weight ? ` · ${e.weight}kg` : ''}
                </Text>
              </View>
            ))}
          </SmartCard>
        )}
        ListEmptyComponent={<EmptyState icon="barbell-outline" title={t('exercise.empty')} />}
      />
    </View>
  );
}

const Stat = ({ icon, val, label, c }: any) => (
  <View style={{ alignItems: 'center', flex: 1, gap: 4 }}>
    <Ionicons name={icon} size={18} color={c.t2} />
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 18 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  stats: { alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 6 },
  modeRow: { gap: 8 },
  modeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  head: { alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  exRow: { alignItems: 'center', gap: 8, paddingVertical: 9, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
});
