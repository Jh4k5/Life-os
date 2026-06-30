// app/(tabs)/more/dopamine/index.tsx  → "Wellbeing"
// Calm digital-wellbeing signal. No green/red candlesticks, no XP rank,
// no trading-dashboard. A gentle weekly sense of healthy vs. draining,
// and AI nudges in the app's own warm voice with an Apply action.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { mockDopamine } from '@/data/mock';

const DAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

const NUDGES = [
  {
    id: 'n1',
    icon: 'phone-portrait-outline' as const,
    text: 'ذكرت السوشيال ميديا ٣ مرات هذا الأسبوع. أحدّد لك ساعة يومياً مقابل ١٥ دقيقة قراءة؟',
  },
  {
    id: 'n2',
    icon: 'moon-outline' as const,
    text: 'نومك تأخّر ليلتين. أهيّئ لك تذكير هدوء الساعة ١٠:٣٠ هذا الأسبوع؟',
  },
];

export default function WellbeingScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const [activities, setActivities] = useState(mockDopamine.activities);
  const [applied, setApplied] = useState<string[]>([]);

  const toggle = (id: string) =>
    setActivities((p) => p.map((a) => (a.id === id ? { ...a, logged: !a.logged } : a)));

  // weekly sense — soft balance, not candlesticks
  const week = mockDopamine.weekProgress;
  const maxAbs = Math.max(...week.map((v) => Math.abs(v)), 1);
  const healthyShare = Math.round(
    (week.filter((v) => v > 0).reduce((s, v) => s + v, 0) /
      Math.max(week.reduce((s, v) => s + Math.abs(v), 0), 1)) *
      100
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.wellbeing')} accent={c.accent} right={[{ icon: 'add', onPress: () => {}, color: c.accent }]} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        {/* Calm state line */}
        <Text style={[S.state, { color: c.t1, textAlign }]}>
          أسبوعك متوازن — {healthyShare}% من طاقتك ذهبت لأشياء تغذّيك.
        </Text>

        {/* Soft weekly signal (rounded pills, not candlesticks) */}
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
                  <Text style={{ color: c.t3, fontSize: 10 }}>{DAYS[i]}</Text>
                </View>
              );
            })}
          </View>
        </SmartCard>

        {/* AI nudges — the point of this screen */}
        <Text style={[S.label, { color: c.t3, textAlign }]}>من الذكاء</Text>
        {NUDGES.map((n) => {
          const done = applied.includes(n.id);
          return (
            <SmartCard key={n.id}>
              <View style={[S.nudge, { flexDirection: rowDir }]}>
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name={n.icon} size={18} color={c.t1} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 14, lineHeight: 22, textAlign }}>{n.text}</Text>
              </View>
              <Pressable
                onPress={() => setApplied((p) => (p.includes(n.id) ? p : [...p, n.id]))}
                style={[
                  S.applyBtn,
                  { backgroundColor: done ? c.greenDim : c.accentDim, borderColor: done ? c.green : c.accent + '55' },
                ]}
              >
                <Ionicons name={done ? 'checkmark' : 'sparkles-outline'} size={15} color={done ? c.green : c.accent} />
                <Text style={{ color: done ? c.green : c.accent, fontWeight: '700', fontSize: 13 }}>
                  {done ? 'تم التطبيق' : 'طبّق'}
                </Text>
              </Pressable>
            </SmartCard>
          );
        })}

        {/* Activities — calm log, healthy vs draining (no XP scoreboard) */}
        <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.activities')}</Text>
        <SmartCard noPad>
          {activities.map((a, i) => (
            <Pressable
              key={a.id}
              onPress={() => toggle(a.id)}
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
                  {a.type === 'healthy' ? 'يغذّيك' : 'يستنزفك'}
                </Text>
              </View>
              <View
                style={[
                  S.check,
                  { backgroundColor: a.logged ? c.accent : 'transparent', borderColor: a.logged ? c.accent : c.b2 },
                ]}
              >
                {a.logged && <Ionicons name="checkmark" size={13} color="#FFF" />}
              </View>
            </Pressable>
          ))}
        </SmartCard>
      </ScrollView>
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
