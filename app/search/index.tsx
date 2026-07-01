// app/search/index.tsx
// Global search — one field across tasks, journal, study, learning, memory.
// Debounced, grouped by kind, each hit routes into its section.
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { globalSearch, type SearchHit } from '@/services/search';

export default function SearchScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (text: string) => {
    setQ(text);
    if (timer.current) clearTimeout(timer.current);
    if (!text.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const res = await globalSearch(text);
      setHits(res);
      setLoading(false);
    }, 220);
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('search.title')} />
      <View style={[S.search, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <Ionicons name="search-outline" size={18} color={c.t3} />
        <TextInput
          autoFocus
          style={[S.input, { color: c.t1, textAlign }]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={c.t4}
          value={q}
          onChangeText={onChange}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={c.accent} />}
        {!loading && q.length > 0 && (
          <Pressable onPress={() => onChange('')}>
            <Ionicons name="close-circle" size={18} color={c.t3} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.kind}_${h.id}`}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(item.route as Href)}>
            <SmartCard padSize="sm">
              <View style={[S.row, { flexDirection: rowDir }]}>
                <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={c.t2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={{ color: c.t3, fontSize: 12, textAlign, marginTop: 1 }} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <Text style={{ color: c.t4, fontSize: 11 }}>{t(`search.kind_${item.kind}`)}</Text>
              </View>
            </SmartCard>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : q.trim() ? (
            <EmptyState icon="search-outline" title={t('search.no_results')} />
          ) : (
            <EmptyState icon="search-outline" title={t('search.hint')} />
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
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16 },
  row: { alignItems: 'center', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
