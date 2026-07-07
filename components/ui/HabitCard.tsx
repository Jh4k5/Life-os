// components/ui/HabitCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export interface HabitData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'checkbox' | 'counter' | 'timer' | 'stopwatch' | 'quantity';
  target: number;
  unit?: string;
  streak: number;
  bestStreak: number;
  todayValue: number;
  done: boolean;
  timePref: string;
  freq?: string;
  areaId?: string | null;
}

interface Props {
  habit: HabitData;
  onUpdate: (id: string, val: number, done: boolean) => void;
}

export const HabitCard = ({ habit, onUpdate }: Props) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = habit.done ? habit.color + '16' : isDark ? c.bg1 : '#FFFFFF';

  const celebrate = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    scale.value = withSequence(withSpring(1.05, { damping: 4 }), withSpring(1, { damping: 10 }));
  };

  // ── CHECKBOX ──────────────────────────
  if (habit.type === 'checkbox') {
    const toggle = async () => {
      if (!habit.done) await celebrate();
      else await Haptics.selectionAsync().catch(() => {});
      onUpdate(habit.id, habit.done ? 0 : 1, !habit.done);
    };
    return (
      <Animated.View style={anim}>
        <Pressable
          onPress={toggle}
          style={[
            S.card,
            { backgroundColor: bg, borderColor: habit.done ? habit.color + '55' : c.b1 },
          ]}
        >
          <HabitRow habit={habit} c={c}>
            <View
              style={[
                S.checkbox,
                {
                  backgroundColor: habit.done ? habit.color : 'transparent',
                  borderColor: habit.done ? habit.color : c.b2,
                },
              ]}
            >
              {habit.done && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
          </HabitRow>
        </Pressable>
      </Animated.View>
    );
  }

  // ── COUNTER / QUANTITY ────────────────
  if (habit.type === 'counter' || habit.type === 'quantity') {
    const progress = Math.min(habit.todayValue / habit.target, 1);
    const isDone = habit.todayValue >= habit.target;
    const inc = async () => {
      const nv = habit.todayValue + 1;
      if (nv >= habit.target && !isDone) await celebrate();
      else await Haptics.selectionAsync().catch(() => {});
      onUpdate(habit.id, nv, nv >= habit.target);
    };
    const dec = async () => {
      if (habit.todayValue <= 0) return;
      await Haptics.selectionAsync().catch(() => {});
      onUpdate(habit.id, habit.todayValue - 1, false);
    };
    return (
      <Animated.View style={anim}>
        <View
          style={[S.card, { backgroundColor: bg, borderColor: isDone ? habit.color + '55' : c.b1 }]}
        >
          <HabitRow habit={habit} c={c}>
            <View style={S.counterRow}>
              <Pressable onPress={dec} style={[S.cBtn, { borderColor: c.b2 }]}>
                <Ionicons name="remove" size={16} color={c.t2} />
              </Pressable>
              <Text style={[S.cVal, { color: habit.color }]}>{habit.todayValue}</Text>
              <Pressable
                onPress={inc}
                style={[S.cBtn, { backgroundColor: habit.color, borderColor: habit.color }]}
              >
                <Ionicons name="add" size={16} color="#FFF" />
              </Pressable>
            </View>
          </HabitRow>
          <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 4 }}>
            <View style={[S.pBg, { backgroundColor: c.b1 }]}>
              <View
                style={[S.pFill, { width: `${progress * 100}%`, backgroundColor: habit.color }]}
              />
            </View>
            <Text style={[S.pTxt, { color: c.t3 }]}>
              {habit.todayValue} / {habit.target} {habit.unit ?? ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── TIMER / STOPWATCH ─────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [running, setRunning] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [elapsed, setElapsed] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetSec = habit.target * 60;
  const progress = habit.type === 'timer' ? Math.min(elapsed / targetSec, 1) : 0;
  const isDone = habit.type === 'timer' ? elapsed >= targetSec : habit.done;

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleTimer = async () => {
    if (running) {
      if (ref.current) clearInterval(ref.current);
      setRunning(false);
      if (habit.type === 'timer' && elapsed >= targetSec) await celebrate();
      onUpdate(habit.id, Math.floor(elapsed / 60), habit.type === 'timer' && elapsed >= targetSec);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setRunning(true);
      ref.current = setInterval(() => {
        setElapsed((p) => {
          if (habit.type === 'timer' && p >= targetSec) {
            if (ref.current) clearInterval(ref.current);
            setRunning(false);
            celebrate();
            onUpdate(habit.id, habit.target, true);
            return targetSec;
          }
          return p + 1;
        });
      }, 1000);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(
    () => () => {
      if (ref.current) clearInterval(ref.current);
    },
    []
  );

  return (
    <Animated.View style={anim}>
      <View
        style={[
          S.card,
          {
            backgroundColor: bg,
            borderColor: running ? habit.color : isDone ? habit.color + '55' : c.b1,
            borderWidth: running ? 1.5 : 1,
          },
        ]}
      >
        <HabitRow habit={habit} c={c}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[S.timerTxt, { color: habit.color }]}>{fmt(elapsed)}</Text>
            <Pressable
              onPress={toggleTimer}
              style={[
                S.timerBtn,
                {
                  backgroundColor: running ? c.redDim : habit.color + '20',
                  borderColor: running ? c.red : habit.color,
                },
              ]}
            >
              <Ionicons
                name={running ? 'pause' : 'play'}
                size={16}
                color={running ? c.red : habit.color}
              />
            </Pressable>
          </View>
        </HabitRow>
        {habit.type === 'timer' && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 4 }}>
            <View style={[S.pBg, { backgroundColor: c.b1 }]}>
              <View
                style={[S.pFill, { width: `${progress * 100}%`, backgroundColor: habit.color }]}
              />
            </View>
            <Text style={[S.pTxt, { color: c.t3 }]}>
              {fmt(elapsed)} / {fmt(targetSec)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const HabitRow = ({
  habit,
  c,
  children,
}: {
  habit: HabitData;
  c: ReturnType<typeof useTheme>['c'];
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      paddingBottom: habit.type === 'checkbox' ? 14 : 8,
    }}
  >
    <View
      style={{
        width: 46,
        height: 46,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: habit.color + '20',
      }}
    >
      <Text style={{ fontSize: 22 }}>{habit.emoji}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: c.t1 }}>{habit.name}</Text>
      {habit.streak > 0 && (
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#F59E0B', marginTop: 2 }}>
          {t('habits.streak', { n: habit.streak })} {habit.streak === habit.bestStreak ? `· 🏆 ${t('habits.best_word')}` : ''}
        </Text>
      )}
    </View>
    {children}
  </View>
  );
};

const S = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginVertical: 4, overflow: 'hidden' },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cVal: { fontSize: 20, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  timerTxt: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 5, borderRadius: 3 },
  pTxt: { fontSize: 11 },
});
