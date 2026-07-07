// app/(tabs)/more/focus/index.tsx
// Focus section — selectable techniques (Pomodoro / 52-17 / deep work / custom,
// all durations configurable), optional task link, and a distraction-free
// running screen with a phase engine (focus → short/long break), end-of-phase
// local notifications + haptics. Sessions persist through services/repository
// and survive a full restart; weekly stats come from repository.focusWeek().
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { repository } from '@/services/repository';
import { notifications } from '@/services/notifications';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

type Phase = 'focus' | 'short_break' | 'long_break';
interface Cfg {
  focus: number;
  brk: number;
  long: number;
  rounds: number; // focus rounds before a long break
}

const TECHNIQUES: { id: string; cfg: Cfg }[] = [
  { id: 'pomodoro', cfg: { focus: 25, brk: 5, long: 15, rounds: 4 } },
  { id: '5217', cfg: { focus: 52, brk: 17, long: 17, rounds: 4 } },
  { id: 'deep', cfg: { focus: 90, brk: 20, long: 20, rounds: 2 } },
  { id: 'custom', cfg: { focus: 30, brk: 8, long: 25, rounds: 4 } },
];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default function FocusScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();

  // ── Setup state ──
  const [techId, setTechId] = useState('pomodoro');
  const [cfg, setCfg] = useState<Cfg>(TECHNIQUES[0].cfg);
  const [task, setTask] = useState(''); // linked task title ('' = general)
  const [energyBefore, setEnergyBefore] = useState(4);

  const { data: sessions, reload } = useAsync(() => repository.listFocusSessions(), [], 'focusSessions');
  const { data: week } = useAsync(() => repository.focusWeek(), { minutes: 0, count: 0 }, 'focusWeek');
  const { data: tasks } = useAsync(() => repository.listTasks(), [], 'focusTasks');
  const openTasks = tasks.filter((x) => !x.done).slice(0, 8);

  const pickTechnique = (id: string) => {
    const tech = TECHNIQUES.find((x) => x.id === id)!;
    setTechId(id);
    setCfg(tech.cfg);
    feedback.select();
  };

  // ── Running state (drives the distraction-free overlay) ──
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('focus');
  const [round, setRound] = useState(0); // completed focus rounds
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds

  const phaseRef = useRef<Phase>('focus');
  const roundRef = useRef(0);
  const cfgRef = useRef<Cfg>(cfg);
  const endsAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingRef = useRef(false);

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };
  useEffect(() => () => stopTick(), []);

  const minutesFor = (p: Phase) =>
    p === 'focus' ? cfgRef.current.focus : p === 'long_break' ? cfgRef.current.long : cfgRef.current.brk;

  // Schedule the end-of-phase notification at the exact end time (fires even if
  // the app is backgrounded). The banner describes the phase that is ENDING.
  const scheduleEnd = (p: Phase, at: Date) => {
    const ending =
      p === 'focus'
        ? { title: t('focus.focus_done_title'), body: t('focus.focus_done_body') }
        : { title: t('focus.break_done_title'), body: t('focus.break_done_body') };
    notifications.scheduleReminder(ending.title, ending.body, at).catch(() => {});
  };

  const startPhase = (p: Phase) => {
    const secs = minutesFor(p) * 60;
    phaseRef.current = p;
    setPhase(p);
    setPaused(false);
    setRemaining(secs);
    endsAtRef.current = Date.now() + secs * 1000;
    completingRef.current = false;
    scheduleEnd(p, new Date(endsAtRef.current));
    if (!tickRef.current) tickRef.current = setInterval(tick, 250);
  };

  // Advance the phase machine. `natural` = the phase ran to completion (a focus
  // phase that completes is logged as a real session; a skipped one is not).
  const advance = useCallback(
    (natural: boolean) => {
      const p = phaseRef.current;
      feedback.success();
      if (p === 'focus') {
        if (natural) {
          repository
            .addFocusSession({
              task: task.trim() || t('focus.general'),
              durationMin: cfgRef.current.focus,
              energyBefore,
              technique: techId,
            })
            .then(() => reload())
            .catch(() => {});
        }
        const nextRound = roundRef.current + 1;
        roundRef.current = nextRound;
        setRound(nextRound);
        startPhase(nextRound % cfgRef.current.rounds === 0 ? 'long_break' : 'short_break');
      } else {
        startPhase('focus');
      }
    },
    [task, energyBefore, techId, reload, t]
  );

  const tick = () => {
    const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0 && !completingRef.current) {
      completingRef.current = true;
      advance(true);
    }
  };

  const begin = () => {
    cfgRef.current = cfg;
    roundRef.current = 0;
    setRound(0);
    setEnergyBefore(energyBefore);
    setRunning(true);
    feedback.press();
    startPhase('focus');
  };

  const togglePause = () => {
    if (paused) {
      endsAtRef.current = Date.now() + remaining * 1000;
      setPaused(false);
      scheduleEnd(phaseRef.current, new Date(endsAtRef.current));
    } else {
      setPaused(true);
      notifications.cancelAll().catch(() => {});
    }
    feedback.tap();
  };

  const skip = () => {
    notifications.cancelAll().catch(() => {});
    completingRef.current = true;
    advance(false); // skipping does not log a session
    feedback.tap();
  };

  const end = () => {
    stopTick();
    notifications.cancelAll().catch(() => {});
    // Honest partial logging: if we abandon mid-focus, record the minutes done.
    if (phaseRef.current === 'focus') {
      const elapsedMin = Math.round((cfgRef.current.focus * 60 - remaining) / 60);
      if (elapsedMin >= 1) {
        repository
          .addFocusSession({
            task: task.trim() || t('focus.general'),
            durationMin: elapsedMin,
            energyBefore,
            technique: techId,
          })
          .then(() => reload())
          .catch(() => {});
      }
    }
    setRunning(false);
    setPaused(false);
    feedback.tap();
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getDate()}/${d.getMonth() + 1} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const phaseLabel = (p: Phase) =>
    p === 'focus' ? t('focus.phase_focus') : p === 'long_break' ? t('focus.phase_long') : t('focus.phase_short');
  const isBreak = phase !== 'focus';

  const Stepper = ({ label, value, unit, onDec, onInc }: { label: string; value: number; unit: string; onDec: () => void; onInc: () => void }) => (
    <View style={[S.stepRow, { flexDirection: rowDir }]}>
      <Text style={{ color: c.t2, fontSize: 14, flex: 1, textAlign }}>{label}</Text>
      <View style={[S.stepCtrl, { flexDirection: rowDir }]}>
        <Pressable onPress={() => { onDec(); feedback.tap(); }} style={[S.stepBtn, { backgroundColor: c.bg3, borderColor: c.b1 }]}>
          <Ionicons name="remove" size={18} color={c.t1} />
        </Pressable>
        <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, minWidth: 56, textAlign: 'center' }}>
          {value} {unit}
        </Text>
        <Pressable onPress={() => { onInc(); feedback.tap(); }} style={[S.stepBtn, { backgroundColor: c.bg3, borderColor: c.b1 }]}>
          <Ionicons name="add" size={18} color={c.t1} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.focus')} accent={c.focus} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 110 }}>
        {/* Technique picker */}
        <Text style={[S.label, { color: c.t2, textAlign }]}>{t('focus.technique')}</Text>
        <View style={{ gap: 10 }}>
          {TECHNIQUES.map((tech) => {
            const sel = techId === tech.id;
            return (
              <Pressable
                key={tech.id}
                onPress={() => pickTechnique(tech.id)}
                style={[
                  S.techCard,
                  { flexDirection: rowDir, backgroundColor: sel ? c.accentDim : c.bg2, borderColor: sel ? c.accent : c.b1 },
                ]}
              >
                <View style={[S.techIcon, { backgroundColor: sel ? c.accent : c.bg3 }]}>
                  <Ionicons
                    name={tech.id === 'deep' ? 'telescope-outline' : tech.id === 'custom' ? 'options-outline' : 'timer-outline'}
                    size={20}
                    color={sel ? '#FFF' : c.t2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, textAlign }}>{t('focus.t_' + tech.id)}</Text>
                  <Text style={{ color: c.t3, fontSize: 12, marginTop: 2, textAlign }}>{t('focus.t_' + tech.id + '_desc')}</Text>
                </View>
                {sel && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>

        {/* Configurable durations — all techniques adjustable */}
        <SmartCard>
          <View style={{ gap: 12 }}>
            <Stepper label={t('focus.focus_length')} value={cfg.focus} unit={t('focus.min_unit')}
              onDec={() => setCfg((p) => ({ ...p, focus: clamp(p.focus - 5, 5, 120) }))}
              onInc={() => setCfg((p) => ({ ...p, focus: clamp(p.focus + 5, 5, 120) }))} />
            <Stepper label={t('focus.break_length')} value={cfg.brk} unit={t('focus.min_unit')}
              onDec={() => setCfg((p) => ({ ...p, brk: clamp(p.brk - 1, 1, 60) }))}
              onInc={() => setCfg((p) => ({ ...p, brk: clamp(p.brk + 1, 1, 60) }))} />
            <Stepper label={t('focus.long_break_length')} value={cfg.long} unit={t('focus.min_unit')}
              onDec={() => setCfg((p) => ({ ...p, long: clamp(p.long - 5, 5, 60) }))}
              onInc={() => setCfg((p) => ({ ...p, long: clamp(p.long + 5, 5, 60) }))} />
            <Stepper label={t('focus.rounds')} value={cfg.rounds} unit=""
              onDec={() => setCfg((p) => ({ ...p, rounds: clamp(p.rounds - 1, 2, 8) }))}
              onInc={() => setCfg((p) => ({ ...p, rounds: clamp(p.rounds + 1, 2, 8) }))} />
          </View>
        </SmartCard>

        {/* Link a task (optional) */}
        <Text style={[S.label, { color: c.t2, textAlign }]}>{t('focus.link_task')}</Text>
        <View style={[S.input, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}>
          <Ionicons name="bulb-outline" size={18} color={c.focus} />
          <TextInput
            style={{ flex: 1, color: c.t1, textAlign }}
            placeholder={t('focus.what_doing')}
            placeholderTextColor={c.t4}
            value={task}
            onChangeText={setTask}
          />
        </View>
        {openTasks.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {openTasks.map((x) => (
              <Pressable
                key={x.id}
                onPress={() => { setTask(x.title); feedback.select(); }}
                style={[S.taskChip, { backgroundColor: task === x.title ? c.accentDim : c.bg2, borderColor: task === x.title ? c.accent : c.b1 }]}
              >
                <Text style={{ color: task === x.title ? c.accent : c.t2, fontSize: 13 }} numberOfLines={1}>{x.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Energy before */}
        <Text style={[S.label, { color: c.t2, textAlign }]}>{t('focus.energy_before')}</Text>
        <View style={{ flexDirection: rowDir, gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => { setEnergyBefore(n); feedback.select(); }}
              style={[S.energyBtn, { backgroundColor: energyBefore === n ? c.focus : c.bg2, borderColor: energyBefore === n ? c.focus : c.b1 }]}
            >
              <Text style={{ color: energyBefore === n ? '#FFF' : c.t2, fontWeight: '700', fontSize: 16 }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Begin */}
        <Pressable onPress={begin} style={[S.beginBtn, { backgroundColor: c.accent }]}>
          <Ionicons name="play" size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>{t('focus.begin')}</Text>
        </Pressable>

        {/* Weekly stats */}
        <View style={{ flexDirection: rowDir, gap: 8 }}>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.focus, fontWeight: '800', fontSize: 24 }}>{week.minutes}</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.week_minutes')}</Text>
          </SmartCard>
          <SmartCard style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 24 }}>{week.count}</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{t('focus.week_sessions')}</Text>
          </SmartCard>
        </View>

        {/* History */}
        <Text style={[S.label, { color: c.t2, textAlign }]}>{t('focus.history')}</Text>
        {sessions.length === 0 ? (
          <Text style={{ color: c.t4, fontSize: 13, paddingHorizontal: 4, textAlign }}>{t('focus.no_sessions')}</Text>
        ) : (
          <SmartCard>
            {sessions.map((f, i) => (
              <View key={f.id} style={[S.histRow, { flexDirection: rowDir }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}>
                <View style={[S.histIcon, { backgroundColor: c.focus + '20' }]}>
                  <Text style={{ color: c.focus, fontWeight: '700', fontSize: 13 }}>{f.durationMin}m</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, textAlign }} numberOfLines={1}>{f.task}</Text>
                  <Text style={{ color: c.t3, fontSize: 11, marginTop: 2, textAlign }}>
                    {fmtWhen(f.at)}{f.technique ? ` · ${t('focus.t_' + f.technique)}` : ''}
                  </Text>
                </View>
                <Text style={{ color: c.t3, fontSize: 12 }}>⚡ {f.energyBefore}</Text>
              </View>
            ))}
          </SmartCard>
        )}
      </ScrollView>

      {/* ── Distraction-free running overlay ── */}
      <Modal visible={running} animationType="fade" onRequestClose={end}>
        <View style={[S.run, { backgroundColor: isBreak ? c.bg1 : c.bg0 }]}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: isBreak ? c.accent : c.focus, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>
              {phaseLabel(phase).toUpperCase()}
            </Text>
            <Text style={{ color: c.t3, fontSize: 13 }}>{t('focus.round', { n: round + 1 })}</Text>
          </View>

          <Text style={[S.runTimer, { color: c.t1 }]}>{fmt(remaining)}</Text>

          {!!task.trim() && !isBreak && (
            <Text style={{ color: c.t2, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 }} numberOfLines={2}>
              {task.trim()}
            </Text>
          )}

          {/* Round dots */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Array.from({ length: cfgRef.current.rounds }).map((_, i) => (
              <View
                key={i}
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < round % cfgRef.current.rounds || (round > 0 && round % cfgRef.current.rounds === 0) ? c.focus : c.b2 }}
              />
            ))}
          </View>

          {/* Controls */}
          <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center', marginTop: 12 }}>
            <Pressable onPress={skip} style={[S.ctrlGhost, { borderColor: c.b2 }]}>
              <Ionicons name="play-skip-forward" size={22} color={c.t2} />
            </Pressable>
            <Pressable onPress={togglePause} style={[S.ctrlMain, { backgroundColor: c.accent }]}>
              <Ionicons name={paused ? 'play' : 'pause'} size={30} color="#FFF" />
            </Pressable>
            <Pressable onPress={end} style={[S.ctrlGhost, { borderColor: c.b2 }]}>
              <Ionicons name="stop" size={22} color={c.red} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 44, marginTop: 2 }}>
            <Text style={{ color: c.t4, fontSize: 12 }}>{t('focus.skip')}</Text>
            <Text style={{ color: c.t4, fontSize: 12 }}>{paused ? t('focus.resume') : t('focus.pause')}</Text>
            <Text style={{ color: c.t4, fontSize: 12 }}>{t('focus.end')}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  techCard: { alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  techIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepRow: { alignItems: 'center' },
  stepCtrl: { alignItems: 'center', gap: 10 },
  stepBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  taskChip: { maxWidth: 180, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  energyBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  beginBtn: { flexDirection: 'row', gap: 10, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  histRow: { alignItems: 'center', gap: 12, paddingVertical: 10 },
  histIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Running overlay
  run: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  runTimer: { fontSize: 84, fontWeight: '200', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  ctrlGhost: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctrlMain: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
});
