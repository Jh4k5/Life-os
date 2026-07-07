// components/ui/ViewToggle.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Opt {
  key: string;
  label: string;
  emoji?: string;
  /** Monochrome Ionicon (v3) — preferred over emoji. */
  icon?: keyof typeof Ionicons.glyphMap;
}
interface Props {
  options: Opt[];
  active: string;
  onChange: (k: string) => void;
}

export const ViewToggle = ({ options, active, onChange }: Props) => {
  const { c, isDark } = useTheme();
  const pct = 100 / options.length;
  const slide = useSharedValue(options.findIndex((o) => o.key === active) * pct);
  const sStyle = useAnimatedStyle(() => ({ left: `${slide.value}%` }));

  const press = (key: string) => {
    const i = options.findIndex((o) => o.key === key);
    slide.value = withSpring(i * pct, { damping: 16, stiffness: 220 });
    onChange(key);
  };

  const Wrap: React.ComponentType<any> = isDark ? BlurView : View;
  const wrapProps = isDark ? { intensity: 30, tint: 'dark' as const } : {};

  return (
    <View style={S.outer}>
      <Wrap
        {...wrapProps}
        style={[
          S.pill,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.bg3,
            borderColor: c.b1,
          },
        ]}
      >
        <Animated.View
          style={[S.indicator, { width: `${pct}%`, backgroundColor: c.accent }, sStyle]}
        />
        {options.map((opt) => {
          const isActive = opt.key === active;
          return (
            <Pressable key={opt.key} onPress={() => press(opt.key)} style={S.opt}>
              {opt.icon ? (
                <Ionicons name={opt.icon} size={15} color={isActive ? '#FFF' : c.t2} />
              ) : (
                opt.emoji && <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
              )}
              <Text
                numberOfLines={1}
                style={[
                  S.optTxt,
                  {
                    color: isActive ? '#FFF' : c.t2,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </Wrap>
    </View>
  );
};

const S = StyleSheet.create({
  outer: { paddingHorizontal: 16, paddingVertical: 8 },
  pill: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: { position: 'absolute', top: 4, bottom: 4, borderRadius: 10, zIndex: 0 },
  opt: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, zIndex: 1 },
  optTxt: { fontSize: 14 },
});
