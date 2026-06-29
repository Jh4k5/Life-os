// components/ui/MicButton.tsx
import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
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

export const MicButton = ({ size = 'large', onDone }: Props) => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [state, setState] = useState<MicState>('idle');
  const btnSize = size === 'large' ? 90 : 64;
  const iconSize = size === 'large' ? 34 : 24;

  const scale = useSharedValue(1);
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const op1 = useSharedValue(0);
  const op2 = useSharedValue(0);

  const pulse = () => {
    scale.value = withRepeat(
      withSequence(withSpring(1.06, { damping: 5 }), withSpring(1, { damping: 10 })),
      -1,
      true
    );
    ring1.value = withRepeat(
      withTiming(1.9, { duration: 1100, easing: Easing.out(Easing.ease) }),
      -1
    );
    op1.value = withRepeat(
      withSequence(withTiming(0.45, { duration: 150 }), withTiming(0, { duration: 950 })),
      -1
    );
    ring2.value = withRepeat(
      withTiming(2.6, { duration: 1700, easing: Easing.out(Easing.ease) }),
      -1
    );
    op2.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 300 }), withTiming(0, { duration: 1400 })),
      -1
    );
  };

  const stopPulse = () => {
    scale.value = withSpring(1);
    op1.value = withTiming(0);
    op2.value = withTiming(0);
    ring1.value = withSpring(1);
    ring2.value = withSpring(1);
  };

  const press = async () => {
    if (state === 'idle') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setState('recording');
      pulse();
    } else if (state === 'recording') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState('processing');
      stopPulse();
      setTimeout(() => {
        setState('idle');
        onDone?.('');
      }, 1800);
    }
  };

  const color = state === 'recording' ? c.red : c.accent;
  const aBtn = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const aR1 = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: op1.value }));
  const aR2 = useAnimatedStyle(() => ({ transform: [{ scale: ring2.value }], opacity: op2.value }));
  const label =
    state === 'recording'
      ? t('home.mic_rec')
      : state === 'processing'
        ? t('home.mic_proc')
        : t('home.mic_idle');

  return (
    <View style={S.wrap}>
      <Animated.View
        style={[
          S.ring,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2, borderColor: color },
          aR1,
        ]}
      />
      <Animated.View
        style={[
          S.ring,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2, borderColor: color },
          aR2,
        ]}
      />
      <Animated.View style={aBtn}>
        <Pressable
          onPress={press}
          style={[
            S.btn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnSize / 2,
              backgroundColor: color + '20',
              borderColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
        >
          {state === 'processing' ? (
            <Ionicons name="sync-outline" size={iconSize} color={color} />
          ) : (
            <Ionicons name={state === 'recording' ? 'stop' : 'mic'} size={iconSize} color={color} />
          )}
        </Pressable>
      </Animated.View>
      <Text style={[S.label, { color: c.t2 }]}>{label}</Text>
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  ring: { position: 'absolute', borderWidth: 1.5 },
  btn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  label: { fontSize: 13, fontWeight: '500', marginTop: 4 },
});
