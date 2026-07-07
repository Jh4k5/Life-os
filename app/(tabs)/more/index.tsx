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
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

type Item = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  sub: string;
  badge?: number;
};

// Static groups. `sub` holds an i18n key resolved in the component below.
const STATIC_GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'focus_learn',
    items: [
      { key: 'study', icon: 'school-outline', route: '/(tabs)/more/study', sub: 'more.sub_study' },
      { key: 'learning', icon: 'library-outline', route: '/(tabs)/more/learning', sub: 'more.sub_learning' },
      { key: 'focus', icon: 'timer-outline', route: '/(tabs)/more/focus', sub: 'more.sub_focus' },
      { key: 'schedule', icon: 'calendar-outline', route: '/(tabs)/more/schedule', sub: 'more.sub_schedule' },
    ],
  },
  {
    title: 'body',
    items: [
      { key: 'health', icon: 'fitness-outline', route: '/(tabs)/more/health', sub: 'more.sub_health' },
      { key: 'exercise', icon: 'barbell-outline', route: '/(tabs)/more/exercise', sub: 'more.sub_exercise' },
    ],
  },
  {
    title: 'intelligence',
    items: [
      { key: 'ai_studio', icon: 'sparkles-outline', route: '/(tabs)/more/ai-studio', sub: 'more.sub_ai_studio' },
      { key: 'memory', icon: 'git-network-outline', route: '/(tabs)/more/memory', sub: 'more.sub_memory' },
      { key: 'ai_hub', icon: 'shield-checkmark-outline', route: '/(tabs)/more/ai-hub', sub: 'more.sub_ai_hub' },
      { key: 'wellbeing', icon: 'pulse-outline', route: '/(tabs)/more/dopamine', sub: 'more.sub_wellbeing' },
    ],
  },
];

export default function MoreScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const router = useRouter();

  // Live previews — real repository counts, refreshed on focus.
  const { data: habits } = useAsync(() => repository.listHabits(), [], 'habits');
  const { data: tasks } = useAsync(() => repository.listTasks(), [], 'tasks');
  const { data: journals } = useAsync(() => repository.listJournal(), [], 'journal');
  const habitsLeft = habits.filter((h) => !h.done).length;
  const tasksLeft = tasks.filter((tk) => !tk.done).length;

  const GROUPS: { title: string; items: Item[] }[] = [
    {
      title: 'life',
      items: [
        { key: 'areas', icon: 'map-outline', route: '/(tabs)/more/areas', sub: t('more.sub_areas') },
        { key: 'habits', icon: 'repeat-outline', route: '/(tabs)/more/habits', sub: t('more.sub_habits', { n: habitsLeft }), badge: habitsLeft },
        { key: 'tasks', icon: 'checkmark-circle-outline', route: '/(tabs)/more/tasks', sub: t('more.sub_tasks', { n: tasksLeft }), badge: tasksLeft },
        { key: 'journal', icon: 'book-outline', route: '/(tabs)/more/journal', sub: t('more.sub_journal', { n: journals.length }) },
      ],
    },
    // STATIC_GROUPS carry i18n keys in `sub` — resolve them now.
    ...STATIC_GROUPS.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it, sub: t(it.sub) })) })),
  ];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('nav.more')}
        back={false}
        right={[
          { icon: 'search-outline', onPress: () => router.push('/search'), color: c.t2 },
          { icon: 'settings-outline', onPress: () => router.push('/settings'), color: c.t2 },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 24 }}>
        {GROUPS.map((group) => (
          <View key={group.title} style={{ gap: 10 }}>
            <Text style={[S.groupTitle, { color: c.t3, textAlign }]}>{t(`groups.${group.title}`)}</Text>
            <View style={S.grid}>
              {group.items.map((it) => (
                <View key={it.key} style={S.cell}>
                  <SectionCard
                    section={{ key: it.key, icon: it.icon, sub: it.sub, badge: it.badge }}
                    onPress={() => router.push(it.route as Href)}
                  />
                </View>
              ))}
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
