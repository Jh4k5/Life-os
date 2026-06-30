// app/(tabs)/more/index.tsx
// Not a settings page. Quiet grouped hierarchy, monochrome line icons,
// single accent, live secondary metadata. No rainbow, no clip-art.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { SectionCard } from '@/components/ui/SectionCard';
import { Header } from '@/components/layout/Header';
import { mockHabits, mockTasks } from '@/data/mock';

type Item = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  subKey: string;
  /** dynamic count injected into the sub i18n string + badge */
  count?: () => number;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'life',
    items: [
      { key: 'areas', icon: 'map-outline', route: '/(tabs)/more/areas', subKey: 'more.sub_areas' },
      {
        key: 'habits',
        icon: 'repeat-outline',
        route: '/(tabs)/more/habits',
        subKey: 'more.sub_habits',
        count: () => mockHabits.filter((h) => !h.done).length,
      },
      {
        key: 'tasks',
        icon: 'checkmark-circle-outline',
        route: '/(tabs)/more/tasks',
        subKey: 'more.sub_tasks',
        count: () => mockTasks.filter((tk) => !tk.done).length,
      },
      { key: 'journal', icon: 'book-outline', route: '/(tabs)/more/journal', subKey: 'more.sub_journal' },
    ],
  },
  {
    title: 'focus_learn',
    items: [
      { key: 'study', icon: 'school-outline', route: '/(tabs)/more/study', subKey: 'more.sub_study' },
      { key: 'learning', icon: 'library-outline', route: '/(tabs)/more/learning', subKey: 'more.sub_learning' },
      { key: 'focus', icon: 'timer-outline', route: '/(tabs)/more/focus', subKey: 'more.sub_focus' },
      { key: 'schedule', icon: 'calendar-outline', route: '/(tabs)/more/schedule', subKey: 'more.sub_schedule' },
    ],
  },
  {
    title: 'intelligence',
    items: [
      { key: 'ai_studio', icon: 'sparkles-outline', route: '/(tabs)/more/ai-studio', subKey: 'more.sub_ai_studio' },
      { key: 'ai_hub', icon: 'git-network-outline', route: '/(tabs)/more/ai-hub', subKey: 'more.sub_ai_hub' },
      { key: 'wellbeing', icon: 'pulse-outline', route: '/(tabs)/more/dopamine', subKey: 'more.sub_wellbeing' },
    ],
  },
];

export default function MoreScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const router = useRouter();

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('nav.more')}
        back={false}
        right={[{ icon: 'settings-outline', onPress: () => router.push('/settings'), color: c.t2 }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 24 }}>
        {GROUPS.map((group) => (
          <View key={group.title} style={{ gap: 10 }}>
            <Text style={[S.groupTitle, { color: c.t3, textAlign }]}>{t(`groups.${group.title}`)}</Text>
            <View style={S.grid}>
              {group.items.map((it) => {
                const n = it.count?.();
                return (
                  <View key={it.key} style={S.cell}>
                    <SectionCard
                      section={{ key: it.key, icon: it.icon, sub: t(it.subKey, { n }), badge: n }}
                      onPress={() => router.push(it.route as Href)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  groupTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 4, letterSpacing: 0.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%' },
});
