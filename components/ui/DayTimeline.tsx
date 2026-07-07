// components/ui/DayTimeline.tsx
// The dashboard's calm vertical timeline of TODAY — built from the user's real
// events (captures, exams, appointments, study sessions), not a mockup. Time on
// the leading edge (RTL-aware); the "now" marker is the next upcoming block.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { useAsync } from '@/hooks/useAsync';
import { repository } from '@/services/repository';
import type { ScheduleEvent } from '@/data/mock';

// Arabic-Indic digits only where the language uses them (ar/ur); Latin otherwise.
const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR[+d]);

const ICON_FOR: Record<string, keyof typeof Ionicons.glyphMap> = {
  event: 'calendar-outline',
  task: 'checkbox-outline',
  study: 'school-outline',
  exam: 'document-text-outline',
  habit: 'repeat-outline',
};

export const DayTimeline = () => {
  const { c } = useTheme();
  const { t, i18n } = useTranslation();
  const { rowDir } = useRTL();
  const { data: events } = useAsync(() => repository.listEvents(), [] as ScheduleEvent[], 'events');
  const fmtTime = (s: string) => (i18n.language === 'ar' || i18n.language === 'ur' ? toArabicDigits(s) : s);

  const nowHM = new Date().toTimeString().slice(0, 5);
  const blocks = [...events].sort((a, b) => a.start.localeCompare(b.start));
  // "now" = first block not yet started; else the last one.
  const nowIdx = (() => {
    const i = blocks.findIndex((b) => b.start >= nowHM);
    return i === -1 ? blocks.length - 1 : i;
  })();

  if (blocks.length === 0) {
    return (
      <View style={[S.empty, { borderColor: c.b1, backgroundColor: c.bg1 }]}>
        <Ionicons name="sunny-outline" size={20} color={c.t3} />
        <Text style={{ color: c.t2, fontSize: 13, textAlign: 'center' }}>
          {t('dash.timeline_empty')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 0 }}>
      {blocks.map((b, i) => {
        const isNow = i === nowIdx;
        const done = b.start < nowHM && !isNow;
        return (
          <View key={b.id} style={[S.row, { flexDirection: rowDir }]}>
            <View style={S.timeCol}>
              <Text style={[S.time, { color: isNow ? c.accent : c.t3 }]}>{b.allDay ? t('common.today') : fmtTime(b.start)}</Text>
            </View>
            <View style={S.railCol}>
              <View
                style={[
                  S.node,
                  {
                    backgroundColor: done ? c.accent : isNow ? c.bg0 : c.bg2,
                    borderColor: isNow ? c.accent : done ? c.accent : c.b2,
                  },
                ]}
              >
                {done && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              {i < blocks.length - 1 && <View style={[S.rail, { backgroundColor: c.b1 }]} />}
            </View>
            <View style={[S.card, { backgroundColor: c.bg1, borderColor: isNow ? c.accent + '55' : c.b1 }]}>
              <View style={[S.cardTop, { flexDirection: rowDir }]}>
                <Ionicons name={ICON_FOR[b.source] ?? 'ellipse-outline'} size={16} color={isNow ? c.accent : c.t2} />
                <Text style={[S.title, { color: c.t1 }]} numberOfLines={1}>
                  {b.title}
                </Text>
                {done && <Text style={{ color: c.green, fontSize: 11, fontWeight: '600' }}>{t('dash.passed')}</Text>}
                {isNow && <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>{t('dash.next')}</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const S = StyleSheet.create({
  row: { gap: 10, minHeight: 56 },
  timeCol: { width: 46, paddingTop: 2 },
  time: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  railCol: { alignItems: 'center', width: 16 },
  node: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 2, flex: 1, marginVertical: 2 },
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8 },
  cardTop: { alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '600', flex: 1 },
  empty: { borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 10 },
});
