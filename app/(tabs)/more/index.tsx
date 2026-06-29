// app/(tabs)/more/index.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SectionCard } from '@/components/ui/SectionCard';
import { Header } from '@/components/layout/Header';
import { mockHabits, mockTasks } from '@/data/mock';

const SECTIONS = [
  { key: 'areas', emoji: '🗺', colorKey: 'areas', route: '/(tabs)/more/areas', sub: 'مجالات حياتك' },
  {
    key: 'habits',
    emoji: '💎',
    colorKey: 'habits',
    route: '/(tabs)/more/habits',
    sub: `${mockHabits.filter((h) => !h.done).length} متبقية اليوم`,
  },
  {
    key: 'tasks',
    emoji: '✅',
    colorKey: 'tasks',
    route: '/(tabs)/more/tasks',
    sub: `${mockTasks.filter((t) => !t.done).length} مهام`,
  },
  { key: 'journal', emoji: '📖', colorKey: 'journal', route: '/(tabs)/more/journal', sub: 'يومياتك الشخصية' },
  { key: 'study', emoji: '🎓', colorKey: 'study', route: '/(tabs)/more/study', sub: 'كورسات وامتحانات' },
  { key: 'learning', emoji: '📚', colorKey: 'learning', route: '/(tabs)/more/learning', sub: 'كتب وبودكاست' },
  { key: 'focus', emoji: '⚡', colorKey: 'focus', route: '/(tabs)/more/focus', sub: 'جلسات تركيز عميق' },
  { key: 'schedule', emoji: '📅', colorKey: 'schedule', route: '/(tabs)/more/schedule', sub: 'تقويمك الذكي' },
  { key: 'dopamine', emoji: '🔋', colorKey: 'dopamine', route: '/(tabs)/more/dopamine', sub: 'صحتك الرقمية' },
  { key: 'ai_hub', emoji: '🤖', colorKey: 'ai_hub', route: '/(tabs)/more/ai-hub', sub: 'مركز القيادة AI' },
] as const;

export default function MoreScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('nav.more')}
        back={false}
        right={[{ icon: 'settings-outline', onPress: () => router.push('/settings'), color: c.t2 }]}
      />
      <FlatList
        data={SECTIONS}
        numColumns={2}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 110 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item: sec }) => (
          <SectionCard
            section={{
              key: sec.key,
              emoji: sec.emoji,
              colorKey: sec.colorKey as any,
              badge:
                sec.key === 'habits'
                  ? mockHabits.filter((h) => !h.done).length
                  : sec.key === 'tasks'
                    ? mockTasks.filter((t) => !t.done).length
                    : 0,
              sub: sec.sub,
            }}
            onPress={() => router.push(sec.route as Href)}
          />
        )}
      />
    </View>
  );
}

const S = StyleSheet.create({ screen: { flex: 1 } });
