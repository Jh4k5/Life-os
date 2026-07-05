// app/(tabs)/more/ai-hub/index.tsx  → "Intelligence"
// The one place the AI's understanding of your life is visible: deep search
// over your real memory graph, the insights it noticed across every section,
// and a way to teach it facts about you. All real — no seeded graph, no fake
// inbox. What you add here (facts) and everywhere else feeds the same brain.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { QuickLogSheet } from '@/components/ui/QuickLogSheet';
import { repository, type MemoryHit } from '@/services/repository';
import { intelligence, type Insight } from '@/services/intelligence';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

const KIND_ICON: Record<Insight['kind'], keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  correlation: 'git-compare-outline',
  warning: 'alert-circle-outline',
  opportunity: 'bulb-outline',
  trend: 'trending-up-outline',
};

export default function IntelligenceScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryHit[]>([]);
  const [addingFact, setAddingFact] = useState(false);
  const { data: insights, reload: reloadInsights } = useAsync(() => intelligence.listInsights(), [] as Insight[], 'ai_insights');
  const { data: facts, reload: reloadFacts } = useAsync(
    () => repository.searchMemory('').then((all) => all.filter((n) => n.type === 'fact')),
    [] as MemoryHit[],
    'ai_facts'
  );

  const onSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setResults(await repository.searchMemory(q));
  };

  const addFact = async (v: Record<string, string>) => {
    const label = (v.fact ?? '').trim();
    if (!label) return;
    await repository.addMemoryNode(label, 'fact');
    reloadFacts();
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.ai_hub')}
        accent={c.accent}
        right={[
          { icon: 'add', onPress: () => { feedback.tap(); setAddingFact(true); }, color: c.accent },
          { icon: 'shield-checkmark-outline', onPress: () => router.push('/trust-center'), color: c.t2 },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        {/* Deep search over the real memory graph */}
        <View style={[S.search, { backgroundColor: c.bg2, borderColor: c.b1, flexDirection: rowDir }]}>
          <Ionicons name="search-outline" size={18} color={c.t3} />
          <TextInput
            style={[S.searchInput, { color: c.t1, textAlign }]}
            placeholder={t('ai_hub.search_placeholder')}
            placeholderTextColor={c.t4}
            value={query}
            onChangeText={onSearch}
          />
        </View>
        {query.trim().length > 0 && (
          results.length > 0 ? (
            <SmartCard noPad>
              {results.map((r, i) => (
                <View
                  key={r.id}
                  style={[S.resRow, { flexDirection: rowDir }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
                >
                  <Ionicons name="git-network-outline" size={16} color={c.t3} />
                  <Text style={{ color: c.t1, fontSize: 14, flex: 1, textAlign }}>{r.label}</Text>
                </View>
              ))}
            </SmartCard>
          ) : (
            <Text style={{ color: c.t3, fontSize: 13, textAlign, paddingHorizontal: 4 }}>{t('ai_hub.no_results')}</Text>
          )
        )}

        {/* What the AI noticed — real insights across every section */}
        <View style={[S.inboxHead, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>{t('ai_hub.noticed')}</Text>
          <Pressable onPress={() => { feedback.tap(); reloadInsights(); }} hitSlop={8}>
            <Ionicons name="refresh-outline" size={16} color={c.t3} />
          </Pressable>
        </View>
        {insights.length > 0 ? (
          insights.slice(0, 6).map((ins) => (
            <SmartCard key={ins.id}>
              <View style={[S.row, { flexDirection: rowDir }]}>
                <View style={[S.nIcon, { backgroundColor: c.accentDim }]}>
                  <Ionicons name={KIND_ICON[ins.kind]} size={17} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', lineHeight: 21, textAlign }}>{ins.title}</Text>
                  {ins.body ? (
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 3, lineHeight: 18, textAlign }}>{ins.body}</Text>
                  ) : null}
                </View>
              </View>
            </SmartCard>
          ))
        ) : (
          <SmartCard>
            <Text style={{ color: c.t3, fontSize: 13, lineHeight: 20, textAlign }}>{t('ai_hub.no_insights')}</Text>
          </SmartCard>
        )}

        {/* Facts you've taught it about you */}
        <View style={[S.inboxHead, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>{t('ai_hub.about_you')}</Text>
          <Pressable onPress={() => { feedback.tap(); setAddingFact(true); }} style={[S.addChip, { backgroundColor: c.accentDim }]}>
            <Ionicons name="add" size={13} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('ai_hub.add_fact')}</Text>
          </Pressable>
        </View>
        {facts.length === 0 ? (
          <SmartCard>
            <Text style={{ color: c.t3, fontSize: 13, lineHeight: 20, textAlign }}>{t('ai_hub.facts_hint')}</Text>
          </SmartCard>
        ) : (
          <SmartCard noPad>
            {facts.map((f, i) => (
              <Pressable
                key={f.id}
                onLongPress={async () => { feedback.warning(); await repository.removeMemoryNode(f.id); reloadFacts(); }}
                style={[S.resRow, { flexDirection: rowDir }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
              >
                <Ionicons name="person-circle-outline" size={16} color={c.accent} />
                <Text style={{ color: c.t1, fontSize: 14, flex: 1, textAlign }}>{f.label}</Text>
              </Pressable>
            ))}
          </SmartCard>
        )}

        {/* Trust & privacy */}
        <Pressable onPress={() => router.push('/trust-center')}>
          <SmartCard>
            <View style={[S.row, { flexDirection: rowDir }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={c.green} />
              <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{t('ai_hub.trust_center')}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.t3} />
            </View>
          </SmartCard>
        </Pressable>
      </ScrollView>

      {addingFact && (
        <QuickLogSheet
          visible={addingFact}
          title={t('ai_hub.add_fact')}
          icon="person-circle-outline"
          fields={[{ key: 'fact', label: t('ai_hub.fact_label'), placeholder: t('ai_hub.fact_placeholder') }]}
          submitLabel={t('ai_hub.add_fact')}
          onClose={() => setAddingFact(false)}
          onSubmit={addFact}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  search: { alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  resRow: { alignItems: 'center', gap: 10, padding: 14 },
  inboxHead: { alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700' },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  nIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { gap: 12, alignItems: 'center' },
});
