// app/(tabs)/more/schedule/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { mockEvents } from '@/data/mock';

type SView = 'week' | 'day' | 'agenda';

const SOURCE_ICON: Record<string, string> = {
  event: '📌',
  task: '✅',
  study: '🎓',
  exam: '📝',
  habit: '💎',
};

const DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function ScheduleScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [view, setView] = useState<SView>('day');
  const [selectedDay, setSelectedDay] = useState(3);

  const timed = mockEvents.filter((e) => !e.allDay).sort((a, b) => a.start.localeCompare(b.start));
  const allDay = mockEvents.filter((e) => e.allDay);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.schedule')} accent={c.schedule} right={[{ icon: 'add', onPress: () => {}, color: c.accent }]} />
      <ViewToggle
        options={[
          { key: 'week', label: t('schedule.week'), emoji: '🗓' },
          { key: 'day', label: t('schedule.day'), emoji: '📆' },
          { key: 'agenda', label: t('schedule.agenda'), emoji: '📋' },
        ]}
        active={view}
        onChange={(v) => setView(v as SView)}
      />

      {/* Week strip */}
      {view === 'week' && (
        <View style={S.weekStrip}>
          {DAYS.map((d, i) => (
            <View
              key={i}
              style={[
                S.dayCell,
                { backgroundColor: selectedDay === i ? c.schedule : c.bg2, borderColor: selectedDay === i ? c.schedule : c.b1 },
              ]}
              onTouchEnd={() => setSelectedDay(i)}
            >
              <Text style={{ color: selectedDay === i ? '#FFF' : c.t3, fontSize: 11 }}>{d}</Text>
              <Text style={{ color: selectedDay === i ? '#FFF' : c.t1, fontWeight: '700', fontSize: 16, marginTop: 2 }}>
                {26 + i}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}>
        {/* All-day events */}
        {allDay.length > 0 && (
          <SmartCard accent={c.schedule}>
            {allDay.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 16 }}>{SOURCE_ICON[e.source]}</Text>
                <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600' }}>{e.title}</Text>
                <Text style={{ color: c.schedule, fontSize: 11 }}>{t('schedule.all_day')}</Text>
              </View>
            ))}
          </SmartCard>
        )}

        {/* Timeline / agenda */}
        {timed.map((e) => (
          <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
            {view !== 'agenda' && (
              <View style={{ width: 48, alignItems: 'flex-end' }}>
                <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>{e.start}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <SmartCard accent={e.color} padSize="sm">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[S.bar, { backgroundColor: e.color }]} />
                  <Text style={{ fontSize: 16 }}>{SOURCE_ICON[e.source]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600' }}>{e.title}</Text>
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>
                      {e.start} - {e.end}
                      {e.location ? ` · ${e.location}` : ''}
                    </Text>
                  </View>
                </View>
              </SmartCard>
            </View>
          </View>
        ))}

        {mockEvents.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
            <Text style={{ fontSize: 50 }}>📅</Text>
            <Text style={{ color: c.t3, fontSize: 16 }}>{t('schedule.no_events')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  weekStrip: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  bar: { width: 4, height: 32, borderRadius: 2 },
});
