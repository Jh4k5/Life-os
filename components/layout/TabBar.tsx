// components/layout/TabBar.tsx
import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const TABS = [
  { key: 'home', active: 'home', inactive: 'home-outline' },
  { key: 'more', active: 'grid', inactive: 'grid-outline' },
] as const;

interface Props {
  current: string;
  onPress: (k: string) => void;
}

export const TabBar = ({ current, onPress }: Props) => {
  const { c, isDark } = useTheme();
  const pbottom = Platform.OS === 'ios' ? 28 : 12;

  const Inner = () => (
    <View style={[S.row, { paddingBottom: pbottom }]}>
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          active={current === tab.key}
          c={c}
          onPress={onPress}
        />
      ))}
    </View>
  );

  if (isDark) {
    return (
      <View style={[S.wrap, { bottom: 0 }]}>
        <BlurView intensity={60} tint="dark" style={[S.bar, { borderTopColor: c.b1 }]}>
          <Inner />
        </BlurView>
      </View>
    );
  }
  return (
    <View style={[S.wrap, { bottom: 0 }]}>
      <View
        style={[
          S.bar,
          S.lightBar,
          { borderTopColor: c.b1, backgroundColor: 'rgba(255,255,255,0.96)' },
        ]}
      >
        <Inner />
      </View>
    </View>
  );
};

const TabItem = ({
  tab,
  active,
  c,
  onPress,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  c: ReturnType<typeof useTheme>['c'];
  onPress: (k: string) => void;
}) => {
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const press = async () => {
    await Haptics.selectionAsync().catch(() => {});
    sc.value = withSpring(0.8, { damping: 5 }, () => {
      sc.value = withSpring(1, { damping: 12 });
    });
    onPress(tab.key);
  };
  return (
    <Pressable onPress={press} style={S.tab}>
      <Animated.View style={[S.tabInner, anim]}>
        <View style={[S.iconWrap, { backgroundColor: active ? c.accent + '22' : 'transparent' }]}>
          <Ionicons name={active ? tab.active : tab.inactive} size={24} color={active ? c.accent : c.t3} />
        </View>
        {active && <View style={[S.dot, { backgroundColor: c.accent }]} />}
      </Animated.View>
    </Pressable>
  );
};

const S = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0 },
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  lightBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  row: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabInner: { alignItems: 'center', gap: 4 },
  iconWrap: { width: 46, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
