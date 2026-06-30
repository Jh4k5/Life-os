// app/(tabs)/more/learning/index.tsx
// Learning Hub — rebuilt on the design system (ui-ux-pro-max).
// Sibling language to Study: single-accent chrome, Ionicons, token colors, RTL.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard, StatRow, IconTile, Badge, ProgressRing, Chip, EmptyState } from '@/components/ui';
import { mockLibrary, type LibraryItem } from '@/data/mock';

type LibFilter = 'all' | 'in_progress' | 'want_to_read' | 'completed';

const TYPE_ICON: Record<LibraryItem['type'], keyof typeof Ionicons.glyphMap> = {
  book: 'book-outline',
  podcast: 'mic-outline',
  article: 'document-text-outline',
  video: 'play-circle-outline',
  course: 'school-outline',
  link: 'link-outline',
};

const STATUS_TONE: Record<LibraryItem['status'], 'neutral' | 'accent' | 'green' | 'red'> = {
  want_to_read: 'neutral',
  in_progress: 'accent',
  completed: 'green',
  dropped: 'red',
};

export default function LearningScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [filter, setFilter] = useState<LibFilter>('all');

  // Mock-backed pending learningRepo swap (Workstream A).
  const library = mockLibrary;
  const filtered = useMemo(
    () => library.filter((l) => filter === 'all' || l.status === filter),
    [library, filter],
  );
  const inProgress = library.filter((l) => l.status === 'in_progress').length;
  const completed = library.filter((l) => l.status === 'completed').length;

  const statusLabel: Record<LibraryItem['status'], string> = {
    want_to_read: t('learning.status_want'),
    in_progress: t('learning.status_prog'),
    completed: t('learning.status_done'),
    dropped: t('learning.status_drop'),
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.learning')}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/learning/new'), color: c.accent }]}
      />

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <SmartCard style={{ marginTop: 8 }}>
              <StatRow
                stats={[
                  { icon: 'library-outline', value: library.length, label: t('learning.in_library') },
                  { icon: 'book-outline', value: inProgress, label: t('learning.status_prog') },
                  { icon: 'checkmark-done-outline', value: completed, label: t('learning.status_done') },
                ]}
              />
            </SmartCard>
            <View style={[S.filters, { flexDirection: rowDir }]}>
              <Chip label={t('learning.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip
                label={t('learning.status_prog')}
                selected={filter === 'in_progress'}
                onPress={() => setFilter('in_progress')}
              />
              <Chip
                label={t('learning.status_want')}
                selected={filter === 'want_to_read'}
                onPress={() => setFilter('want_to_read')}
              />
              <Chip
                label={t('learning.status_done')}
                selected={filter === 'completed'}
                onPress={() => setFilter('completed')}
              />
            </View>
          </View>
        }
        renderItem={({ item: lib }) => (
          <LibraryCard
            item={lib}
            c={c}
            statusLabel={statusLabel[lib.status]}
            statusTone={STATUS_TONE[lib.status]}
            rowDir={rowDir}
            textAlign={textAlign}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="library-outline"
            title={t('learning.empty')}
            action={{ label: t('learning.new'), icon: 'add', onPress: () => router.push('/(tabs)/more/learning/new') }}
          />
        }
      />
    </View>
  );
}

const LibraryCard = ({
  item: lib,
  c,
  statusLabel,
  statusTone,
  rowDir,
  textAlign,
}: {
  item: LibraryItem;
  c: ReturnType<typeof useTheme>['c'];
  statusLabel: string;
  statusTone: 'neutral' | 'accent' | 'green' | 'red';
  rowDir: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
}) => (
  <SmartCard style={{ marginVertical: 5 }}>
    <View style={[S.row, { flexDirection: rowDir }]}>
      <IconTile icon={TYPE_ICON[lib.type] ?? 'document-text-outline'} size="lg" />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, textAlign }} numberOfLines={2}>
          {lib.title}
        </Text>
        {!!lib.author && (
          <Text style={{ color: c.t2, fontSize: 12.5, textAlign }} numberOfLines={1}>
            {lib.author}
          </Text>
        )}
        <View style={[S.metaRow, { flexDirection: rowDir }]}>
          <Badge label={statusLabel} tone={statusTone} size="sm" />
          {lib.rating > 0 && <Stars n={lib.rating} c={c} />}
          {lib.tags.slice(0, 2).map((tag) => (
            <Text key={tag} style={{ color: c.t3, fontSize: 11.5 }}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
      {lib.progress > 0 && <ProgressRing progress={lib.progress / 100} size={44} />}
    </View>
    {!!lib.notes && (
      <View style={[S.noteRow, { borderTopColor: c.b0, flexDirection: rowDir }]}>
        <Ionicons name="bulb-outline" size={14} color={c.t3} />
        <Text style={{ color: c.t3, fontSize: 12.5, flex: 1, textAlign }} numberOfLines={2}>
          {lib.notes}
        </Text>
      </View>
    )}
  </SmartCard>
);

const Stars = ({ n, c }: { n: number; c: ReturnType<typeof useTheme>['c'] }) => (
  <View style={{ flexDirection: 'row', gap: 1 }}>
    {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
      <Ionicons key={i} name="star" size={11} color={c.yellow} />
    ))}
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  filters: { gap: 8, marginTop: 14, marginBottom: 4, flexWrap: 'wrap' },
  row: { gap: 12, alignItems: 'flex-start' },
  metaRow: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  noteRow: {
    alignItems: 'center',
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 10,
  },
});
