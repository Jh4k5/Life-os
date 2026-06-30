// app/(tabs)/more/focus/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { mockFocusSessions } from '@/data/mock';

export default function FocusScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [energyBefore, setEnergyBefore] = useState(4);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (ref.current) clearInterval(ref.current);
    },
    []
  );

  const toggle = () => {
    if (running) {
      if (ref.current) clearInterval(ref.current);
      setRunning(false);
    } else {
      setRunning(true);
      ref.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
  };

  const reset = () => {
    if (ref.current) clearInterval(ref.current);
    setRunning(false);
    setElapsed(0);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const totalMin = mockFocusSessions.reduce((s, f) => s + f.duration, 0);
  const avg = Math.round(totalMin / Math.max(mockFocusSessions.length, 1));

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.focus')} accent={c.accent} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Timer hero */}
        <SmartCard accent={c.accent} elevated>
          <View style={{ alignItems: 'center', gap: 16, paddingVertical: 14 }}>
            <Text style={[S.timer, { color: running ? c.accent : c.t1 }]}>{fmt(elapsed)}</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={toggle} style={[S.bigBtn, { backgroundColor: c.accent }]}>
                <Ionicons name={running ? 'pause' : 'play'} size={26} color="#FFF" />
              </Pressable>
              {elapsed > 0 && (
                <Pressable onPress={reset} style={[S.bigBtn, { backgroundColor: c.bg3, borderColor: c.b2, borderWidth: 1 }]}>
                  <Ionicons name="stop" size={24} color={c.t2} />
                </Pressable>
              )}
            </View>
            <Text style={{ color: c.t3, fontSize: 13 }}>
              {running ? t('focus.session') : t('focus.start')}
            </Text>
          </View>
        </SmartCard>

        {/* Setup */}
        <View style={[S.input, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
          <Ionicons name="bulb-outline" size={18} color={c.accent} />
          <TextInput
            style={{ flex: 1, color: c.t1 }}
            placeholder={t('focus.what_doing')}
            placeholderTextColor={c.t4}
            value={task}
            onChangeText={setTask}
          />
        </View>

        <Text style={[S.label, { color: c.t2 }]}>{t('focus.energy_before')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setEnergyBefore(n)}
              style={[
                S.energyBtn,
                { backgroundColor: energyBefore === n ? c.accent : c.bg2, borderColor: energyBefore === n ? c.accent : c.b1 },
              ]}
            >
              <Text style={{ color: energyBefore === n ? '#FFF' : c.t2, fontWeight: '700', fontSize: 16 }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 24 }}>{Math.round(totalMin / 60)}h</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.total')}</Text>
          </SmartCard>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 24 }}>{avg}m</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.avg')}</Text>
          </SmartCard>
        </View>

        {/* History */}
        <Text style={[S.label, { color: c.t2 }]}>{t('focus.history')}</Text>
        <SmartCard>
          {mockFocusSessions.map((f, i) => (
            <View
              key={f.id}
              style={[S.histRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
            >
              <View style={[S.histIcon, { backgroundColor: c.accent + '20' }]}>
                <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>{f.duration}m</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontSize: 14 }} numberOfLines={1}>
                  {f.task}
                </Text>
                <Text style={{ color: c.t3, fontSize: 11, marginTop: 2 }}>{f.date}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="flash-outline" size={12} color={c.t3} />
                <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                  {f.energyBefore}→{f.energyAfter}
                </Text>
              </View>
            </View>
          ))}
        </SmartCard>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  timer: { fontSize: 48, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bigBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  input: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  label: { fontSize: 14, fontWeight: '700' },
  energyBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  histIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
