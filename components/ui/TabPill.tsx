// components/ui/TabPill.tsx
import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface Tab {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** @deprecated prefer `icon` (Ionicons); kept for back-compat. */
  emoji?: string;
}
interface Props {
  tabs: Tab[];
  active: string;
  onChange: (k: string) => void;
  accent?: string;
}

export const TabPill = ({ tabs, active, onChange, accent }: Props) => {
  const { c } = useTheme();
  const color = accent ?? c.accent;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.wrap}>
      {tabs.map((tab) => (
        <TabPillItem key={tab.key} tab={tab} active={active === tab.key} color={color} c={c} onChange={onChange} />
      ))}
    </ScrollView>
  );
};

const TabPillItem = ({
  tab,
  active,
  color,
  c,
  onChange,
}: {
  tab: Tab;
  active: boolean;
  color: string;
  c: ReturnType<typeof useTheme>['c'];
  onChange: (k: string) => void;
}) => {
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const press = async () => {
    await Haptics.selectionAsync().catch(() => {});
    sc.value = withSpring(0.92, { damping: 6 }, () => {
      sc.value = withSpring(1, { damping: 10 });
    });
    onChange(tab.key);
  };
  return (
    <Animated.View style={anim}>
      <Pressable
        onPress={press}
        style={[
          S.tab,
          {
            backgroundColor: active ? color : c.bg2,
            borderColor: active ? color : c.b1,
          },
        ]}
      >
        {tab.icon ? (
          <Ionicons name={tab.icon} size={15} color={active ? '#FFF' : c.t2} />
        ) : tab.emoji ? (
          <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
        ) : null}
        <Text style={[S.txt, { color: active ? '#FFF' : c.t2 }]}>{tab.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  txt: { fontSize: 14, fontWeight: '600' },
});
