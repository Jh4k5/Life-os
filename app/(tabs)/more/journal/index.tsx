// app/(tabs)/more/journal/index.tsx
// Journal — v3 premium: mood as a semantic dot (not emoji-as-icon), neutral
// glass surfaces, single accent, monochrome Ionicons. No chrome tints.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

// Mood is data, not chrome: a semantic dot + label (green→red scale is allowed).
const MOODS = ['great', 'good', 'neutral', 'bad', 'awful'] as const;
type Mood = (typeof MOODS)[number];
const moodColor = (m: string, c: any) =>
  m === 'great' || m === 'good' ? c.green : m === 'neutral' ? c.t3 : m === 'bad' ? c.orange : c.red;

export default function JournalScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const { data: journals, loading } = useAsync(() => repository.listJournal(), [], "journal");

  const filtered = journals.filter(
    (j) =>
      (!search || j.title.includes(search) || j.preview.includes(search)) &&
      (!filterMood || j.mood === filterMood)
  );
  const pinned = filtered.filter((j) => j.pinned);
  const regular = filtered.filter((j) => !j.pinned);

  const streak = 5;
  const avgWords = Math.round(journals.reduce((s, j) => s + j.words, 0) / Math.max(journals.length, 1));

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
        right={[
          { icon: 'flash-outline', onPress: () => router.push('/(tabs)/more/journal/new?quick=true'), color: c.accent },
          { icon: 'add', onPress: () => router.push('/(tabs)/more/journal/new'), color: c.accent },
        ]}
      />
      {/* Streak banner — monochrome, hairline */}
      <View style={[S.streakBanner, { flexDirection: rowDir, backgroundColor: c.bg1, borderBottomColor: c.b1 }]}>
        <View style={[S.streakIcon, { backgroundColor: c.accentDim }]}>
          <Ionicons name="flame-outline" size={18} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.t1, fontWeight: '700', fontSize: 14, textAlign }}>
            {t('journal.streak_days', { n: streak })}
          </Text>
          <Text style={{ color: c.t3, fontSize: 12, marginTop: 2, textAlign }}>
            {t('journal.entries_avg', { count: journals.length, avg: avgWords })}
          </Text>
        </View>
      </View>
      {/* Search */}
      <View style={[S.search, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <Ionicons name="search-outline" size={16} color={c.t3} />
        <TextInput
          style={[S.searchInput, { color: c.t1, textAlign }]}
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
      {/* Mood filter — semantic dots */}
      <View style={[S.moodFilter, { flexDirection: rowDir }]}>
        {MOODS.map((mood) => {
          const on = filterMood === mood;
          return (
            <Pressable
              key={mood}
              onPress={() => setFilterMood(on ? null : mood)}
              style={[
                S.moodBtn,
                { flexDirection: rowDir, backgroundColor: on ? c.accentDim : c.bg2, borderColor: on ? c.accent : c.b1 },
              ]}
            >
              <View style={[S.moodDot, { backgroundColor: moodColor(mood, c) }]} />
              <Text style={{ color: on ? c.accent : c.t2, fontSize: 12, fontWeight: '600' }}>{t(`journal.mood_${mood}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item: any) => item.id ?? item.label}
        contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 110 }}
        renderItem={({ item }: any) => {
          if (item.type === 'header') {
            return <Text style={[S.secTitle, { color: c.t2, textAlign }]}>{item.label}</Text>;
          }
          return (
            <Pressable onPress={() => router.push(`/(tabs)/more/journal/${item.id}`)}>
              <SmartCard accent={item.pinned ? c.accent : undefined}>
                <View style={[S.entryHeader, { flexDirection: rowDir }]}>
                  <Text style={[S.entryTitle, { color: c.t1, textAlign }]} numberOfLines={1}>
                    {item.icon ? `${item.icon} ` : ''}{item.title}
                  </Text>
                  <View style={[S.moodChip, { flexDirection: rowDir, backgroundColor: c.bg3 }]}>
                    <View style={[S.moodDot, { backgroundColor: moodColor(item.mood, c) }]} />
                    <Text style={{ color: c.t3, fontSize: 11 }}>{item.mood ? t(`journal.mood_${item.mood}`) : ''}</Text>
                  </View>
                </View>
                <Text style={[S.entryPreview, { color: c.t2, textAlign }]} numberOfLines={2}>
                  {item.preview}
                </Text>
                <View style={[S.entryFooter, { flexDirection: rowDir }]}>
                  <View style={{ flexDirection: rowDir, gap: 5, flex: 1, flexWrap: 'wrap' }}>
                    {item.tags.map((tag: string) => (
                      <View key={tag} style={[S.tag, { backgroundColor: c.bg3 }]}>
                        <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: c.t3, fontSize: 11 }}>
                    {t('journal.words_date', { n: item.words, date: item.date })}
                  </Text>
                </View>
              </SmartCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 8 }}>
              {[0, 1, 2].map((k) => (
                <View key={k} style={[S.skeleton, { backgroundColor: c.bg2 }]} />
              ))}
            </View>
          ) : (
            <View style={S.empty}>
              <View style={[S.emptyIcon, { backgroundColor: c.bg2 }]}>
                <Ionicons name="book-outline" size={32} color={c.t3} />
              </View>
              <Text style={{ color: c.t3, fontSize: 15, textAlign: 'center' }}>{t('journal.empty')}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  streakBanner: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  streakIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: {
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
  moodFilter: { gap: 6, paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap' },
  moodBtn: { alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodChip: { alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  secTitle: { fontSize: 13, fontWeight: '600', marginVertical: 4 },
  entryHeader: { justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  entryTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  entryPreview: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  entryFooter: { justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  skeleton: { height: 88, borderRadius: 16, opacity: 0.6 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
