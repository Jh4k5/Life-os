// components/ui/MicButton.tsx
// The hero anchor — must feel alive. Ambient breathing glow at rest,
// a real animated waveform while recording, a calm "thinking" state after.
import React, { useState, useEffect } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type MicState = 'idle' | 'recording' | 'processing';

interface Props {
  size?: 'large' | 'medium';
  onDone?: (text: string) => void;
}

const BARS = [0, 1, 2, 3, 4, 5, 6];

export const MicButton = ({ size = 'large', onDone }: Props) => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [state, setState] = useState<MicState>('idle');
  const btnSize = size === 'large' ? 96 : 64;
  const iconSize = size === 'large' ? 34 : 24;

  // ambient breathing (always on at rest)
  const breathe = useSharedValue(1);
  const halo = useSharedValue(0.35);
  // recording rings
  const ring1 = useSharedValue(1);
  const op1 = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    halo.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(halo);
    };
  }, []);

  const startRings = () => {
    ring1.value = withRepeat(withTiming(2.2, { duration: 1400, easing: Easing.out(Easing.ease) }), -1);
    op1.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 200 }), withTiming(0, { duration: 1200 })),
      -1
    );
  };
  const stopRings = () => {
    cancelAnimation(ring1);
    cancelAnimation(op1);
    ring1.value = withSpring(1);
    op1.value = withTiming(0);
  };

  const onPress = async () => {
    press.value = withSequence(withSpring(0.92, { damping: 12 }), withSpring(1, { damping: 14 }));
    if (state === 'idle') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setState('recording');
      startRings();
    } else if (state === 'recording') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState('processing');
      stopRings();
      setTimeout(() => {
        setState('idle');
        onDone?.('SAMPLE');
      }, 1500);
    }
  };

  const color = state === 'recording' ? c.accentL : c.accent;
  const aBtn = useAnimatedStyle(() => ({ transform: [{ scale: press.value * (state === 'idle' ? breathe.value : 1) }] }));
  const aHalo = useAnimatedStyle(() => ({ opacity: state === 'idle' ? halo.value : 0.5, transform: [{ scale: breathe.value }] }));
  const aRing = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: op1.value }));

  const label =
    state === 'recording' ? t('home.mic_rec') : state === 'processing' ? t('home.mic_proc') : t('home.mic_idle');

  return (
    <View style={S.wrap}>
      {/* ambient halo */}
      <Animated.View
        style={[
          S.haloGlow,
          { width: btnSize * 1.9, height: btnSize * 1.9, borderRadius: btnSize, backgroundColor: c.accentGlow },
          aHalo,
        ]}
      />
      {/* recording ring */}
      <Animated.View
        style={[
          S.ring,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2, borderColor: color },
          aRing,
        ]}
      />
      <Animated.View style={aBtn}>
        <Pressable
          onPress={onPress}
          style={[
            S.btn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnSize / 2,
              backgroundColor: state === 'recording' ? c.accent : c.accentDim,
              borderColor: color,
            },
          ]}
        >
          {state === 'recording' ? (
            <Waveform color="#FFF" />
          ) : state === 'processing' ? (
            <Ionicons name="ellipsis-horizontal" size={iconSize} color={color} />
          ) : (
            <Ionicons name="mic" size={iconSize} color={color} />
          )}
        </Pressable>
      </Animated.View>
      <Text style={[S.label, { color: c.t2 }]}>{label}</Text>
    </View>
  );
};

const Bar = ({ index, color }: { index: number; color: string }) => {
  const h = useSharedValue(0.3);
  useEffect(() => {
    h.value = withDelay(
      index * 90,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 320, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
    return () => cancelAnimation(h);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.value }] }));
  return <Animated.View style={[S.bar, { backgroundColor: color }, style]} />;
};

const Waveform = ({ color }: { color: string }) => (
  <View style={S.waveform}>
    {BARS.map((i) => (
      <Bar key={i} index={i} color={color} />
    ))}
  </View>
);

const S = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  haloGlow: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 1.5 },
  btn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  label: { fontSize: 13, fontWeight: '500' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 28 },
  bar: { width: 3, height: 24, borderRadius: 2 },
});
