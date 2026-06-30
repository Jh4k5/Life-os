// components/ui/Skeleton.tsx
// Loading placeholder with a calm shimmer (respects reduced-motion).
// Use for >300ms loads instead of a blocking spinner.
import React, { useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface BlockProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: object;
}

export const Skeleton = ({ width = '100%', height = 16, radius = 8, style }: BlockProps) => {
  const { c } = useTheme();
  const o = useSharedValue(0.5);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active || reduced) return;
      o.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.5, { duration: 700 }),
        ),
        -1,
        false,
      );
    });
    return () => {
      active = false;
      cancelAnimation(o);
    };
  }, []);

  const anim = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      style={[
        anim,
        { width, height, borderRadius: radius, backgroundColor: c.bg3 },
        style,
      ]}
    />
  );
};

/** Card-shaped skeleton matching SmartCard list rows. */
export const SkeletonCard = () => {
  const { c } = useTheme();
  return (
    <View style={[S.card, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
      <View style={S.head}>
        <Skeleton width={48} height={48} radius={14} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={15} />
          <Skeleton width="38%" height={12} />
        </View>
      </View>
      <Skeleton height={6} radius={3} style={{ marginTop: 14 }} />
      <Skeleton width="45%" height={12} style={{ marginTop: 10 }} />
    </View>
  );
};

export const SkeletonList = ({ count = 4 }: { count?: number }) => (
  <View style={{ padding: 16, gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const S = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
