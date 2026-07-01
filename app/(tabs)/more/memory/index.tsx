// app/(tabs)/more/memory/index.tsx
// Memory Center — semantic-ish recall over the Memory Graph (memory_nodes).
// One search across everything the AI has linked from your captures.
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { repository, type MemoryHit } from '@/services/repository';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  task: 'checkmark-circle-outline',
  journal: 'book-outline',
  note: 'document-text-outline',
  appointment: 'calendar-outline',
  reminder: 'notifications-outline',
  exam: 'school-outline',
  habit: 'repeat-outline',
  meal: 'nutrition-outline',
  workout: 'barbell-outline',
  study_session: 'time-outline',
  person: 'person-outline',
  project: 'folder-outline',
  area: 'map-outline',
  file: 'attach-outline',
};

export default function MemoryScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<MemoryHit[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (query: string) => {
    setLoading(true);
    const res = await repository.searchMemory(query);
    setHits(res);
    setLoading(false);
  };

  React.useEffect(() => {
    run('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = hits ?? [];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.memory')} />
      <View style={[S.search, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <Ionicons name="search-outline" size={17} color={c.t3} />
        <TextInput
          style={[S.input, { color: c.t1, textAlign }]}
          placeholder={t('memory.search_ph')}
          placeholderTextColor={c.t4}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => run(q)}
          returnKeyType="search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => { setQ(''); run(''); }}>
            <Ionicons name="close-circle" size={17} color={c.t3} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <SmartCard padSize="sm">
            <View style={[S.row, { flexDirection: rowDir }]}>
              <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                <Ionicons name={TYPE_ICON[item.type] ?? 'ellipse-outline'} size={16} color={c.t2} />
              </View>
              <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={{ color: c.t4, fontSize: 11 }}>{t(`memory.type_${item.type}`, { defaultValue: item.type })}</Text>
            </View>
          </SmartCard>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="git-network-outline"
              title={q ? t('memory.no_results') : t('memory.empty')}
            />
          )
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  search: {
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15 },
  row: { alignItems: 'center', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
