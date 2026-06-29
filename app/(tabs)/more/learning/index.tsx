// app/(tabs)/more/learning/index.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { TabPill } from '@/components/ui/TabPill';
import { mockLibrary } from '@/data/mock';

type LibFilter = 'all' | 'in_progress' | 'want_to_read' | 'completed';

const TYPE_EMOJI: Record<string, string> = {
  book: '📖',
  podcast: '🎙',
  article: '📄',
  video: '🎬',
  course: '🎓',
  link: '🔗',
};

export default function LearningScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<LibFilter>('all');

  const STATUS_LABEL: Record<string, string> = {
    want_to_read: t('learning.status_want'),
    in_progress: t('learning.status_prog'),
    completed: t('learning.status_done'),
    dropped: t('learning.status_drop'),
  };

  const filtered = mockLibrary.filter((l) => filter === 'all' || l.status === filter);
  const inProgress = mockLibrary.filter((l) => l.status === 'in_progress').length;
  const completed = mockLibrary.filter((l) => l.status === 'completed').length;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.learning')}
        accent={c.learning}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/learning/new'), color: c.accent }]}
      />
      {/* Stats */}
      <View style={[S.statsRow, { backgroundColor: c.learning + '15', borderBottomColor: c.learning + '30' }]}>
        <StatItem val={mockLibrary.length} label="في المكتبة" color={c.learning} c={c} />
        <StatItem val={inProgress} label={t('learning.status_prog')} color={c.schedule} c={c} />
        <StatItem val={completed} label={t('learning.status_done')} color={c.green} c={c} />
      </View>
      <TabPill
        tabs={[
          { key: 'all', label: t('learning.all'), emoji: '📚' },
          { key: 'in_progress', label: t('learning.status_prog'), emoji: '📖' },
          { key: 'want_to_read', label: t('learning.status_want'), emoji: '🔖' },
          { key: 'completed', label: t('learning.status_done'), emoji: '✅' },
        ]}
        active={filter}
        onChange={(f) => setFilter(f as LibFilter)}
        accent={c.learning}
      />
      <FlatList
        data={filtered}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 110 }}
        keyExtractor={(l) => l.id}
        renderItem={({ item: lib }) => (
          <SmartCard>
            <View style={S.libRow}>
              <View style={[S.typeIcon, { backgroundColor: c.learning + '22' }]}>
                <Text style={{ fontSize: 26 }}>{TYPE_EMOJI[lib.type] ?? '📄'}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }} numberOfLines={2}>
                  {lib.title}
                </Text>
                {!!lib.author && <Text style={{ color: c.t2, fontSize: 12 }}>{lib.author}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <View style={[S.statusChip, { backgroundColor: c.learning + '20' }]}>
                    <Text style={{ color: c.learning, fontSize: 11, fontWeight: '600' }}>
                      {STATUS_LABEL[lib.status]}
                    </Text>
                  </View>
                  {lib.rating > 0 && (
                    <Text style={{ fontSize: 11, color: c.t3 }}>{'⭐'.repeat(lib.rating)}</Text>
                  )}
                  {lib.tags.map((tag) => (
                    <Text key={tag} style={{ color: c.t3, fontSize: 11 }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              </View>
              {lib.progress > 0 && (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: c.learning, fontWeight: '800', fontSize: 17 }}>{lib.progress}%</Text>
                  <View style={[S.pBg, { width: 40, backgroundColor: c.b1 }]}>
                    <View style={[S.pFill, { width: `${lib.progress}%`, backgroundColor: c.learning }]} />
                  </View>
                </View>
              )}
            </View>
            {lib.notes && (
              <View style={[S.noteRow, { borderTopColor: c.b0 }]}>
                <Text style={{ color: c.t3, fontSize: 12 }} numberOfLines={2}>
                  💡 {lib.notes}
                </Text>
              </View>
            )}
          </SmartCard>
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={{ fontSize: 50 }}>📚</Text>
            <Text style={{ color: c.t3, fontSize: 15, textAlign: 'center' }}>{t('learning.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const StatItem = ({ val, label, color, c }: any) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text style={{ color, fontWeight: '800', fontSize: 22 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 12 }}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  statsRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1 },
  libRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  typeIcon: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pFill: { height: 4, borderRadius: 2 },
  noteRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 14 },
});
