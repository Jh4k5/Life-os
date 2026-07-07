// app/(tabs)/more/focus/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

export default function FocusScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [energyBefore, setEnergyBefore] = useState(4);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  // Real, persisted session history — survives a full app restart.
  const { data: sessions, reload } = useAsync(() => repository.listFocusSessions(), [], 'focusSessions');

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

  // Stop = save the session (if it ran ≥1 min) then clear the timer.
  const stop = async () => {
    if (ref.current) clearInterval(ref.current);
    setRunning(false);
    const min = Math.round(elapsed / 60);
    if (min >= 1) {
      await repository.addFocusSession({ task: task.trim() || t('focus.session'), durationMin: min, energyBefore });
      feedback.success();
      reload();
    }
    setElapsed(0);
    setTask('');
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getDate()}/${d.getMonth() + 1} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const totalMin = sessions.reduce((s, f) => s + f.durationMin, 0);
  const avg = sessions.length ? Math.round(totalMin / sessions.length) : 0;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.focus')} accent={c.focus} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Timer hero */}
        <SmartCard accent={c.focus} elevated>
          <View style={{ alignItems: 'center', gap: 16, paddingVertical: 14 }}>
            <Text style={[S.timer, { color: running ? c.focus : c.t1 }]}>{fmt(elapsed)}</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={toggle} style={[S.bigBtn, { backgroundColor: c.focus }]}>
                <Ionicons name={running ? 'pause' : 'play'} size={26} color="#FFF" />
              </Pressable>
              {elapsed > 0 && (
                <Pressable onPress={stop} style={[S.bigBtn, { backgroundColor: c.bg3, borderColor: c.b2, borderWidth: 1 }]}>
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
          <Ionicons name="bulb-outline" size={18} color={c.focus} />
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
                { backgroundColor: energyBefore === n ? c.focus : c.bg2, borderColor: energyBefore === n ? c.focus : c.b1 },
              ]}
            >
              <Text style={{ color: energyBefore === n ? '#FFF' : c.t2, fontWeight: '700', fontSize: 16 }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.focus, fontWeight: '800', fontSize: 24 }}>{Math.round(totalMin / 60)}h</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.total')}</Text>
          </SmartCard>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 24 }}>{avg}m</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.avg')}</Text>
          </SmartCard>
        </View>

        {/* History — real, persisted sessions */}
        <Text style={[S.label, { color: c.t2 }]}>{t('focus.history')}</Text>
        {sessions.length === 0 ? (
          <Text style={{ color: c.t4, fontSize: 13, paddingHorizontal: 4 }}>{t('focus.no_sessions')}</Text>
        ) : (
          <SmartCard>
            {sessions.map((f, i) => (
              <View
                key={f.id}
                style={[S.histRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
              >
                <View style={[S.histIcon, { backgroundColor: c.focus + '20' }]}>
                  <Text style={{ color: c.focus, fontWeight: '700', fontSize: 13 }}>{f.durationMin}m</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14 }} numberOfLines={1}>
                    {f.task}
                  </Text>
                  <Text style={{ color: c.t3, fontSize: 11, marginTop: 2 }}>{fmtWhen(f.at)}</Text>
                </View>
                <Text style={{ color: c.t3, fontSize: 12 }}>⚡ {f.energyBefore}</Text>
              </View>
            ))}
          </SmartCard>
        )}
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
