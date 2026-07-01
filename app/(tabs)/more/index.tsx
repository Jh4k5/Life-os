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
  sub: string;
  badge?: number;
};

const habitsLeft = mockHabits.filter((h) => !h.done).length;
const tasksLeft = mockTasks.filter((t) => !t.done).length;

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'life',
    items: [
      { key: 'areas', icon: 'map-outline', route: '/(tabs)/more/areas', sub: 'مجالات حياتك' },
      { key: 'habits', icon: 'repeat-outline', route: '/(tabs)/more/habits', sub: `${habitsLeft} متبقية اليوم`, badge: habitsLeft },
      { key: 'tasks', icon: 'checkmark-circle-outline', route: '/(tabs)/more/tasks', sub: `${tasksLeft} مهام`, badge: tasksLeft },
      { key: 'journal', icon: 'book-outline', route: '/(tabs)/more/journal', sub: 'سلسلة ١٢ يوم' },
    ],
  },
  {
    title: 'focus_learn',
    items: [
      { key: 'study', icon: 'school-outline', route: '/(tabs)/more/study', sub: 'امتحانان قادمان' },
      { key: 'learning', icon: 'library-outline', route: '/(tabs)/more/learning', sub: '٢ قيد القراءة' },
      { key: 'focus', icon: 'timer-outline', route: '/(tabs)/more/focus', sub: '٣ ساعات هذا الأسبوع' },
      { key: 'schedule', icon: 'calendar-outline', route: '/(tabs)/more/schedule', sub: 'تقويمك الذكي' },
    ],
  },
  {
    title: 'body',
    items: [
      { key: 'health', icon: 'fitness-outline', route: '/(tabs)/more/health', sub: 'تغذية + صحة' },
      { key: 'exercise', icon: 'barbell-outline', route: '/(tabs)/more/exercise', sub: 'تمارين + أرقام قياسية' },
    ],
  },
  {
    title: 'intelligence',
    items: [
      { key: 'ai_studio', icon: 'sparkles-outline', route: '/(tabs)/more/ai-studio', sub: 'مساحات ذكية' },
      { key: 'memory', icon: 'git-network-outline', route: '/(tabs)/more/memory', sub: 'استرجاع ذكي' },
      { key: 'ai_hub', icon: 'shield-checkmark-outline', route: '/(tabs)/more/ai-hub', sub: 'ذاكرة + خصوصية' },
      { key: 'wellbeing', icon: 'pulse-outline', route: '/(tabs)/more/dopamine', sub: 'إشارات هادئة' },
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
