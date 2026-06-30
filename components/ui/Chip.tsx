// components/ui/Chip.tsx
// Compact filter / tag chip with press feedback + selection (selectable).
// Use for filters, tags, quick actions. Distinct from TabPill (segmented nav).
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export const Chip = ({ label, onPress, selected = false, icon, color }: Props) => {
  const { c } = useTheme();
  const tone = color ?? c.accent;
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handle = async () => {
    if (!onPress) return;
    await Haptics.selectionAsync().catch(() => {});
    scale.value = withSpring(0.94, { damping: 7 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  const fg = selected ? '#FFF' : c.t2;

  return (
    <Animated.View style={anim}>
      <Pressable
        onPress={handle}
        hitSlop={6}
        style={[
          S.chip,
          {
            backgroundColor: selected ? tone : c.bg2,
            borderColor: selected ? tone : c.b1,
          },
        ]}
      >
        {icon && <Ionicons name={icon} size={14} color={fg} />}
        <Text style={[S.txt, { color: fg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    minHeight: 34,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  txt: { fontSize: 13.5, fontWeight: '600' },
});
