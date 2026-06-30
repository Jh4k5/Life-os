// components/ui/ProgressBar.tsx
// Token-driven progress bar — the single source for all linear progress.
// Replaces ad-hoc inline pBg/pFill blocks scattered across screens.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';

interface Props {
  /** 0..1 */
  progress: number;
  color?: string;
  /** track + fill height */
  height?: number;
  /** animate the fill on mount / change */
  animated?: boolean;
}

export const ProgressBar = ({ progress, color, height = 6, animated = true }: Props) => {
  const { c } = useTheme();
  const { isRTL } = useRTL();
  const tone = color ?? c.accent;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const w = useSharedValue(animated ? 0 : clamped);

  useEffect(() => {
    w.value = animated
      ? withSpring(clamped, { damping: 18, stiffness: 140 })
      : withTiming(clamped, { duration: 0 });
  }, [clamped, animated]);

  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View
      style={[
        S.track,
        { backgroundColor: c.b1, height, borderRadius: height / 2 },
      ]}
    >
      <Animated.View
        style={[
          S.fill,
          fill,
          {
            backgroundColor: tone,
            height,
            borderRadius: height / 2,
            alignSelf: isRTL ? 'flex-end' : 'flex-start',
          },
        ]}
      />
    </View>
  );
};

const S = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
