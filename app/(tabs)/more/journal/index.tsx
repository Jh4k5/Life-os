// app/(tabs)/more/journal/index.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { mockJournals } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '😔',
  awful: '😢',
};

export default function JournalScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const { data: journals } = useAsync(() => repository.listJournal(), mockJournals);

  const filtered = journals.filter(
    (j) =>
      (!search || j.title.includes(search) || j.preview.includes(search)) &&
      (!filterMood || j.mood === filterMood)
  );
  const pinned = filtered.filter((j) => j.pinned);
  const regular = filtered.filter((j) => !j.pinned);

  const streak = 5;

  const listData: any[] = [
    ...(pinned.length > 0 ? [{ type: 'header', label: t('journal.pinned') }] : []),
    ...pinned.map((j) => ({ type: 'entry', ...j })),
    ...(regular.length > 0 ? [{ type: 'header', label: t('journal.all_entries') }] : []),
    ...regular.map((j) => ({ type: 'entry', ...j })),
  ];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.journal')}
        accent={c.journal}
        right={[
          { icon: 'flash-outline', onPress: () => router.push('/(tabs)/more/journal/new?quick=true'), color: c.journal },
          { icon: 'add', onPress: () => router.push('/(tabs)/more/journal/new'), color: c.accent },
        ]}
      />
      {/* Streak banner */}
      <View
        style={[
          S.streakBanner,
          { backgroundColor: c.journal + '15', borderBottomColor: c.journal + '30' },
        ]}
      >
        <Text style={{ fontSize: 22 }}>✍</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.journal, fontWeight: '700', fontSize: 14 }}>
            🔥 سلسلة كتابة {streak} أيام متتالية
          </Text>
          <Text style={{ color: c.t2, fontSize: 12, marginTop: 2 }}>
            {journals.length} مدخلة · متوسط{' '}
            {Math.round(journals.reduce((s, j) => s + j.words, 0) / Math.max(journals.length, 1))} كلمة
          </Text>
        </View>
      </View>
      {/* Search */}
      <View style={[S.search, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <Ionicons name="search-outline" size={16} color={c.t3} />
        <TextInput
          style={[S.searchInput, { color: c.t1 }]}
          placeholder={t('journal.search_ph')}
          placeholderTextColor={c.t4}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={c.t3} />
          </Pressable>
        )}
      </View>
      {/* Mood filter */}
      <View style={S.moodFilter}>
        {(['great', 'good', 'neutral', 'bad', 'awful'] as const).map((mood) => (
          <Pressable
            key={mood}
            onPress={() => setFilterMood(filterMood === mood ? null : mood)}
            style={[
              S.moodBtn,
              {
                backgroundColor: filterMood === mood ? c.journal + '30' : c.bg2,
                borderColor: filterMood === mood ? c.journal : c.b1,
                borderWidth: filterMood === mood ? 2 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>{MOOD_EMOJI[mood]}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item: any) => item.id ?? item.label}
        contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 110 }}
        renderItem={({ item }: any) => {
          if (item.type === 'header') {
            return <Text style={[S.secTitle, { color: c.t2 }]}>{item.label}</Text>;
          }
          return (
            <Pressable onPress={() => router.push(`/(tabs)/more/journal/${item.id}`)}>
              <SmartCard accent={item.pinned ? c.journal : undefined}>
                <View style={S.entryHeader}>
                  <Text style={[S.entryTitle, { color: c.t1 }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 22 }}>{MOOD_EMOJI[item.mood]}</Text>
                </View>
                <Text style={[S.entryPreview, { color: c.t2 }]} numberOfLines={2}>
                  {item.preview}
                </Text>
                <View style={S.entryFooter}>
                  <View style={{ flexDirection: 'row', gap: 5, flex: 1, flexWrap: 'wrap' }}>
                    {item.tags.map((tag: string) => (
                      <View key={tag} style={[S.tag, { backgroundColor: c.journal + '22' }]}>
                        <Text style={{ color: c.journal, fontSize: 11, fontWeight: '600' }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: c.t3, fontSize: 11 }}>
                    {item.words} كلمة · {item.date}
                  </Text>
                </View>
              </SmartCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={{ fontSize: 50 }}>📖</Text>
            <Text style={{ color: c.t3, fontSize: 16, textAlign: 'center' }}>{t('journal.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  moodFilter: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  moodBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 13, fontWeight: '600', marginVertical: 4 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  entryTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  entryPreview: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  entryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 14 },
});
