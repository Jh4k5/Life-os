// components/ui/SectionCard.tsx
// Refined monochrome tile — single accent, line icon, hairline border.
// No rainbow top-bar, no emoji/clip-art.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface Section {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  sub?: string;
}

export const SectionCard = ({ section, onPress }: { section: Section; onPress: () => void }) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  const press = async () => {
    await Haptics.selectionAsync().catch(() => {});
    sc.value = withSpring(0.96, { damping: 14 }, () => {
      sc.value = withSpring(1, { damping: 16 });
    });
    onPress();
  };

  return (
    <Animated.View style={[anim, { flex: 1 }]}>
      <Pressable
        onPress={press}
        style={[
          S.card,
          { backgroundColor: isDark ? c.bg1 : '#FFFFFF', borderColor: c.b1 },
        ]}
      >
        <View style={S.top}>
          <View style={[S.iconWrap, { backgroundColor: isDark ? c.bg3 : c.bg0 }]}>
            <Ionicons name={section.icon} size={20} color={c.t1} />
          </View>
          {!!section.badge && section.badge > 0 && (
            <View style={[S.badge, { backgroundColor: c.accent }]}>
              <Text style={S.badgeTxt}>{section.badge > 99 ? '99+' : section.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[S.name, { color: c.t1 }]} numberOfLines={1}>
          {t(`sections.${section.key}`)}
        </Text>
        {section.sub && (
          <Text style={[S.sub, { color: c.t3 }]} numberOfLines={1}>
            {section.sub}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    height: 124,
    padding: 16,
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', marginTop: 'auto' },
  sub: { fontSize: 12, marginTop: 3 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
