// app/(tabs)/more/learning/index.tsx
// Learning library — v3 premium: monochrome type icons, single accent,
// neutral glass surfaces, semantic status. No emoji-as-icons, no chrome tints.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { TabPill } from '@/components/ui/TabPill';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

type LibFilter = 'all' | 'in_progress' | 'want_to_read' | 'completed';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  book: 'book-outline',
  podcast: 'mic-outline',
  article: 'document-text-outline',
  video: 'film-outline',
  course: 'school-outline',
  link: 'link-outline',
};

export default function LearningScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [filter, setFilter] = useState<LibFilter>('all');
  const { data: library } = useAsync(() => repository.listLibrary(), [], "library");

  const STATUS_LABEL: Record<string, string> = {
    want_to_read: t('learning.status_want'),
    in_progress: t('learning.status_prog'),
    completed: t('learning.status_done'),
    dropped: t('learning.status_drop'),
  };
  const statusColor = (s: string) => (s === 'completed' ? c.green : s === 'in_progress' ? c.accent : c.t3);

  const filtered = library.filter((l) => filter === 'all' || l.status === filter);
  const inProgress = library.filter((l) => l.status === 'in_progress').length;
  const completed = library.filter((l) => l.status === 'completed').length;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.learning')}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/learning/new'), color: c.accent }]}
      />
      {/* Stats — neutral, hairline */}
      <View style={[S.statsRow, { flexDirection: rowDir, backgroundColor: c.bg1, borderBottomColor: c.b1 }]}>
        <StatItem val={library.length} label={t('learning.in_library')} c={c} />
        <View style={[S.vline, { backgroundColor: c.b1 }]} />
        <StatItem val={inProgress} label={t('learning.status_prog')} c={c} />
        <View style={[S.vline, { backgroundColor: c.b1 }]} />
        <StatItem val={completed} label={t('learning.status_done')} c={c} />
      </View>
      <TabPill
        tabs={[
          { key: 'all', label: t('learning.all'), icon: 'albums-outline' },
          { key: 'in_progress', label: t('learning.status_prog'), icon: 'play-outline' },
          { key: 'want_to_read', label: t('learning.status_want'), icon: 'bookmark-outline' },
          { key: 'completed', label: t('learning.status_done'), icon: 'checkmark-done-outline' },
        ]}
        active={filter}
        onChange={(f) => setFilter(f as LibFilter)}
      />
      <FlatList
        data={filtered}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 110 }}
        keyExtractor={(l) => l.id}
        renderItem={({ item: lib }) => (
          <SmartCard>
            <View style={[S.libRow, { flexDirection: rowDir }]}>
              <View style={[S.typeIcon, { backgroundColor: c.bg3 }]}>
                <Ionicons name={TYPE_ICON[lib.type] ?? 'document-text-outline'} size={24} color={c.t1} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, textAlign }} numberOfLines={2}>
                  {lib.title}
                </Text>
                {!!lib.author && <Text style={{ color: c.t2, fontSize: 12, textAlign }}>{lib.author}</Text>}
                <View style={{ flexDirection: rowDir, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <View style={[S.statusChip, { flexDirection: rowDir, backgroundColor: c.bg3 }]}>
                    <View style={[S.dot, { backgroundColor: statusColor(lib.status) }]} />
                    <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>{STATUS_LABEL[lib.status]}</Text>
                  </View>
                  {lib.rating > 0 && (
                    <View style={{ flexDirection: rowDir, gap: 1 }}>
                      {Array.from({ length: lib.rating }).map((_, i) => (
                        <Ionicons key={i} name="star" size={11} color={c.t3} />
                      ))}
                    </View>
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
                  <Text style={{ color: c.accent, fontWeight: '800', fontSize: 17 }}>{lib.progress}%</Text>
                  <View style={[S.pBg, { width: 40, backgroundColor: c.b1 }]}>
                    <View style={[S.pFill, { width: `${lib.progress}%`, backgroundColor: c.accent }]} />
                  </View>
                </View>
              )}
            </View>
            {lib.notes && (
              <View style={[S.noteRow, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                <Ionicons name="bulb-outline" size={14} color={c.t3} />
                <Text style={{ color: c.t3, fontSize: 12, flex: 1, textAlign }} numberOfLines={2}>
                  {lib.notes}
                </Text>
              </View>
            )}
          </SmartCard>
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: c.bg2 }]}>
              <Ionicons name="library-outline" size={32} color={c.t3} />
            </View>
            <Text style={{ color: c.t3, fontSize: 15, textAlign: 'center' }}>{t('learning.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const StatItem = ({ val, label, c }: any) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 22 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 12 }} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  statsRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  vline: { width: StyleSheet.hairlineWidth, height: 32 },
  libRow: { gap: 12, alignItems: 'flex-start' },
  typeIcon: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusChip: { alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  pBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pFill: { height: 4, borderRadius: 2 },
  noteRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 8, gap: 6, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
