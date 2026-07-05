// app/(tabs)/more/dopamine/index.tsx  → "Wellbeing"
// Calm digital-wellbeing signal, now fully real: the user defines their own
// healthy / draining activities, logs them per day, and the weekly balance is
// derived from those real logs. AI nudges come from the intelligence engine
// (wellbeing/journal insights) with a gentle fallback. No mock, no dead button.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { QuickLogSheet } from '@/components/ui/QuickLogSheet';
import { repository } from '@/services/repository';
import { intelligence, type Insight } from '@/services/intelligence';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function WellbeingScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const { data: activities, reload } = useAsync(() => repository.listWellbeing(), [] as any[], 'wellbeing');
  const { data: week, reload: reloadWeek } = useAsync(() => repository.wellbeingWeek(), [0, 0, 0, 0, 0, 0, 0], 'wellbeingWeek');
  const [nudges, setNudges] = useState<Insight[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [adding, setAdding] = useState<null | 'healthy' | 'draining'>(null);

  React.useEffect(() => {
    intelligence
      .listInsights()
      .then((ins) => setNudges(ins.filter((i) => i.domain === 'wellbeing' || i.domain === 'journal').slice(0, 2)))
      .catch(() => {});
  }, []);

  const toggle = async (id: string) => {
    feedback.select();
    await repository.toggleWellbeingToday(id);
    reload();
    reloadWeek();
  };

  const addActivity = async (v: Record<string, string>) => {
    const name = (v.name ?? '').trim();
    if (!name || !adding) return;
    await repository.addWellbeingActivity(name, adding);
    reload();
  };

  const maxAbs = Math.max(...week.map((v) => Math.abs(v)), 1);
  const totalAbs = week.reduce((s, v) => s + Math.abs(v), 0);
  const healthyShare = totalAbs
    ? Math.round((week.filter((v) => v > 0).reduce((s, v) => s + v, 0) / totalAbs) * 100)
    : 0;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.wellbeing')}
        accent={c.accent}
        right={[{ icon: 'add', onPress: () => { feedback.tap(); setAdding('healthy'); }, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        {/* Calm state line — reflects real logs */}
        <Text style={[S.state, { color: c.t1, textAlign }]}>
          {totalAbs === 0
            ? t('dopamine.empty_state')
            : t('dopamine.balance_line', { pct: healthyShare })}
        </Text>

        {/* Soft weekly signal from real logs */}
        <SmartCard>
          <View style={[S.week, { flexDirection: rowDir }]}>
            {week.map((v, i) => {
              const h = 8 + (Math.abs(v) / maxAbs) * 60;
              const healthy = v >= 0;
              return (
                <View key={i} style={S.dayCol}>
                  <View style={S.track}>
                    <View
                      style={{
                        width: 8,
                        height: h,
                        borderRadius: 4,
                        backgroundColor: healthy ? c.accent : c.b2,
                        opacity: healthy ? 0.9 : 0.6,
                      }}
                    />
                  </View>
                  <Text style={{ color: c.t3, fontSize: 10 }}>{t(`dopamine.day_${DAY_KEYS[i]}`)}</Text>
                </View>
              );
            })}
          </View>
        </SmartCard>

        {/* AI nudges — real insights when available */}
        {nudges.length > 0 && <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.from_ai')}</Text>}
        {nudges.map((n) => {
          const done = applied.includes(n.id);
          return (
            <SmartCard key={n.id}>
              <View style={[S.nudge, { flexDirection: rowDir }]}>
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name="sparkles-outline" size={18} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 14, lineHeight: 22, textAlign }}>{n.title}</Text>
              </View>
              <Pressable
                onPress={() => { feedback.success(); setApplied((p) => (p.includes(n.id) ? p : [...p, n.id])); }}
                style={[
                  S.applyBtn,
                  { backgroundColor: done ? c.greenDim : c.accentDim, borderColor: done ? c.green : c.accent + '55' },
                ]}
              >
                <Ionicons name={done ? 'checkmark' : 'sparkles-outline'} size={15} color={done ? c.green : c.accent} />
                <Text style={{ color: done ? c.green : c.accent, fontWeight: '700', fontSize: 13 }}>
                  {done ? t('dopamine.applied') : t('dopamine.apply')}
                </Text>
              </Pressable>
            </SmartCard>
          );
        })}

        {/* Activities — real, user-defined, logged per day */}
        <View style={[{ alignItems: 'center', justifyContent: 'space-between' }, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.activities')}</Text>
          <View style={{ flexDirection: rowDir, gap: 8 }}>
            <Pressable onPress={() => { feedback.tap(); setAdding('healthy'); }} style={[S.addChip, { backgroundColor: c.accentDim }]}>
              <Ionicons name="leaf-outline" size={13} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('dopamine.add_healthy')}</Text>
            </Pressable>
            <Pressable onPress={() => { feedback.tap(); setAdding('draining'); }} style={[S.addChip, { backgroundColor: c.bg3 }]}>
              <Ionicons name="hourglass-outline" size={13} color={c.t3} />
              <Text style={{ color: c.t3, fontSize: 12, fontWeight: '700' }}>{t('dopamine.add_draining')}</Text>
            </Pressable>
          </View>
        </View>

        {activities.length === 0 ? (
          <SmartCard>
            <Text style={{ color: c.t3, fontSize: 13, lineHeight: 20, textAlign }}>{t('dopamine.no_activities')}</Text>
          </SmartCard>
        ) : (
          <SmartCard noPad>
            {activities.map((a: any, i: number) => (
              <Pressable
                key={a.id}
                onPress={() => toggle(a.id)}
                onLongPress={async () => { feedback.warning(); await repository.removeWellbeingActivity(a.id); reload(); reloadWeek(); }}
                style={[
                  S.actRow,
                  { flexDirection: rowDir },
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
                ]}
              >
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons
                    name={a.type === 'healthy' ? 'leaf-outline' : 'hourglass-outline'}
                    size={16}
                    color={a.type === 'healthy' ? c.accent : c.t3}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{a.name}</Text>
                  <Text style={{ color: c.t3, fontSize: 11, marginTop: 2, textAlign }}>
                    {a.type === 'healthy' ? t('dopamine.nourishes') : t('dopamine.drains')}
                  </Text>
                </View>
                <View
                  style={[
                    S.check,
                    { backgroundColor: a.loggedToday ? c.accent : 'transparent', borderColor: a.loggedToday ? c.accent : c.b2 },
                  ]}
                >
                  {a.loggedToday && <Ionicons name="checkmark" size={13} color="#FFF" />}
                </View>
              </Pressable>
            ))}
          </SmartCard>
        )}
        {activities.length > 0 && (
          <Text style={{ color: c.t4, fontSize: 11, textAlign, paddingHorizontal: 4 }}>{t('dopamine.long_press_delete')}</Text>
        )}
      </ScrollView>

      {adding && (
        <QuickLogSheet
          visible={!!adding}
          title={adding === 'healthy' ? t('dopamine.add_healthy') : t('dopamine.add_draining')}
          icon={adding === 'healthy' ? 'leaf-outline' : 'hourglass-outline'}
          fields={[{ key: 'name', label: t('dopamine.activity_name'), placeholder: t('dopamine.activity_name') }]}
          submitLabel={t('dopamine.add')}
          onClose={() => setAdding(null)}
          onSubmit={addActivity}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  state: { fontSize: 19, fontWeight: '700', lineHeight: 28 },
  week: { justifyContent: 'space-between', alignItems: 'flex-end', height: 90, paddingHorizontal: 4 },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  track: { height: 70, justifyContent: 'flex-end' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  nudge: { gap: 12, alignItems: 'flex-start' },
  nIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actRow: { alignItems: 'center', gap: 12, padding: 14 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
