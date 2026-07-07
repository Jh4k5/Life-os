// app/(tabs)/more/schedule/index.tsx
// Schedule — v3 premium: monochrome Ionicons per source, single accent,
// hairline glass. No emoji-as-icons, no per-section chrome tints.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

type SView = 'week' | 'day' | 'agenda';

const SOURCE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  event: 'ellipse-outline',
  task: 'checkmark-circle-outline',
  study: 'school-outline',
  exam: 'document-text-outline',
  habit: 'repeat-outline',
};

const DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function ScheduleScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [view, setView] = useState<SView>('day');
  const [selectedDay, setSelectedDay] = useState(3);
  const { data: events, loading } = useAsync(() => repository.listEvents(), [], "events");

  const timed = events.filter((e) => !e.allDay).sort((a, b) => a.start.localeCompare(b.start));
  const allDay = events.filter((e) => e.allDay);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.schedule')}
        right={[
          { icon: 'scan-outline', onPress: () => router.push('/(tabs)/more/schedule/build'), color: c.accent },
          { icon: 'add', onPress: () => {}, color: c.accent },
        ]}
      />
      <ViewToggle
        options={[
          { key: 'week', label: t('schedule.week'), icon: 'grid-outline' },
          { key: 'day', label: t('schedule.day'), icon: 'today-outline' },
          { key: 'agenda', label: t('schedule.agenda'), icon: 'list-outline' },
        ]}
        active={view}
        onChange={(v) => setView(v as SView)}
      />

      {/* Week strip */}
      {view === 'week' && (
        <View style={[S.weekStrip, { flexDirection: rowDir }]}>
          {DAYS.map((d, i) => {
            const on = selectedDay === i;
            return (
              <Pressable
                key={i}
                onPress={() => setSelectedDay(i)}
                style={[
                  S.dayCell,
                  { backgroundColor: on ? c.accent : c.bg2, borderColor: on ? c.accent : c.b1 },
                ]}
              >
                <Text style={{ color: on ? '#FFF' : c.t3, fontSize: 11 }}>{d}</Text>
                <Text style={{ color: on ? '#FFF' : c.t1, fontWeight: '700', fontSize: 16, marginTop: 2 }}>
                  {26 + i}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}>
        {/* Loading skeleton */}
        {loading && events.length === 0 && (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={[S.skeleton, { backgroundColor: c.bg2 }]} />
            ))}
          </View>
        )}

        {/* All-day events */}
        {allDay.length > 0 && (
          <SmartCard>
            <View style={{ gap: 12 }}>
              {allDay.map((e) => (
                <View key={e.id} style={{ flexDirection: rowDir, alignItems: 'center', gap: 10 }}>
                  <Ionicons name={SOURCE_ICON[e.source] ?? 'ellipse-outline'} size={16} color={c.t2} />
                  <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{e.title}</Text>
                  <Text style={{ color: c.accent, fontSize: 11, fontWeight: '600' }}>{t('schedule.all_day')}</Text>
                </View>
              ))}
            </View>
          </SmartCard>
        )}

        {/* Timeline / agenda */}
        {timed.map((e) => (
          <View key={e.id} style={{ flexDirection: rowDir, gap: 12 }}>
            {view !== 'agenda' && (
              <View style={{ width: 48, alignItems: 'flex-end' }}>
                <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>{e.start}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <SmartCard padSize="sm">
                <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 10 }}>
                  <View style={[S.bar, { backgroundColor: c.accent }]} />
                  <Ionicons name={SOURCE_ICON[e.source] ?? 'ellipse-outline'} size={16} color={c.t2} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{e.title}</Text>
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 2, textAlign }}>
                      {e.start} - {e.end}
                      {e.location ? ` · ${e.location}` : ''}
                    </Text>
                  </View>
                </View>
              </SmartCard>
            </View>
          </View>
        ))}

        {!loading && events.length === 0 && (
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: c.bg2 }]}>
              <Ionicons name="calendar-outline" size={32} color={c.t3} />
            </View>
            <Text style={{ color: c.t3, fontSize: 15 }}>{t('schedule.no_events')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  weekStrip: { gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  bar: { width: 4, height: 32, borderRadius: 2 },
  skeleton: { height: 64, borderRadius: 16, opacity: 0.6 },
  empty: { alignItems: 'center', paddingVertical: 70, gap: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
