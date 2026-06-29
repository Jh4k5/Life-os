// components/ui/SectionCard.tsx
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface Section {
  key: string;
  emoji: string;
  colorKey: keyof ReturnType<typeof useTheme>['c'];
  badge?: number;
  sub?: string; // نص وصفي صغير
}

export const SectionCard = ({ section, onPress }: { section: Section; onPress: () => void }) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const sc = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const color = c[section.colorKey] as string;

  const press = async () => {
    await Haptics.selectionAsync().catch(() => {});
    sc.value = withSpring(0.91, { damping: 6 }, () => {
      sc.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  return (
    <Animated.View style={[anim, { flex: 1 }]}>
      <Pressable
        onPress={press}
        style={[
          S.card,
          {
            backgroundColor: isDark ? c.bg1 : '#FFFFFF',
            borderColor: color + '35',
            shadowColor: color,
          },
        ]}
      >
        {/* شريط لون علوي */}
        <View style={[S.topBar, { backgroundColor: color }]} />
        {/* الأيقونة */}
        <View style={[S.iconWrap, { backgroundColor: color + '22' }]}>
          <Text style={{ fontSize: 24 }}>{section.emoji}</Text>
        </View>
        {/* الاسم */}
        <Text style={[S.name, { color: c.t1 }]} numberOfLines={1}>
          {t(`sections.${section.key}`)}
        </Text>
        {/* وصف صغير */}
        {section.sub && (
          <Text style={[S.sub, { color: c.t3 }]} numberOfLines={1}>
            {section.sub}
          </Text>
        )}
        {/* Badge */}
        {!!section.badge && section.badge > 0 && (
          <View style={[S.badge, { backgroundColor: color }]}>
            <Text style={S.badgeTxt}>{section.badge > 99 ? '99+' : section.badge}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    height: 112,
    paddingBottom: 14,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  topBar: { height: 3 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    marginBottom: 6,
  },
  name: { fontSize: 13, fontWeight: '700', paddingHorizontal: 12 },
  sub: { fontSize: 11, paddingHorizontal: 12, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: 10,
    end: 10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
