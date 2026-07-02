// app/(tabs)/more/journal/[id].tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockJournals } from '@/data/mock';
import { ConnectedLayer } from '@/components/ui/ConnectedLayer';

const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '😔',
  awful: '😢',
};

export default function JournalEntryScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = mockJournals.find((j) => j.id === id);

  if (!entry) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.journal')} accent={c.journal} />
        <EmptyState emoji="📖" title={t('common.empty')} />
      </View>
    );
  }

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={entry.title}
        accent={c.journal}
        right={[{ icon: 'create-outline', onPress: () => {}, color: c.journal }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 30 }}>{MOOD_EMOJI[entry.mood]}</Text>
          <View>
            <Text style={{ color: c.t1, fontSize: 20, fontWeight: '800' }}>{entry.title}</Text>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>
              {entry.date} · {t('journal.words', { n: entry.words })} ·{' '}
              {t('journal.read_time', { n: Math.max(1, Math.round(entry.words / 200)) })}
            </Text>
          </View>
        </View>

        {entry.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {entry.tags.map((tag) => (
              <View key={tag} style={[S.tag, { backgroundColor: c.journal + '22' }]}>
                <Text style={{ color: c.journal, fontSize: 12, fontWeight: '600' }}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <SmartCard>
          <Text style={{ color: c.t1, fontSize: 15, lineHeight: 26, textAlign }}>
            {entry.preview}
            {'\n\n'}
            هذه مساحة شخصية للتعبير والتأمل. اكتب بحرية بأي لغة — الذكاء الاصطناعي يفهم المعنى لا الكلمة.
          </Text>
        </SmartCard>

        {/* AI summary */}
        <SmartCard accent={c.ai_hub}>
          <Text style={{ color: c.ai_hub, fontWeight: '700', fontSize: 13 }}>✨ {t('journal.ai_summary')}</Text>
          <Text style={{ color: c.t2, fontSize: 13, marginTop: 6, lineHeight: 20, textAlign }}>
            يوم مليء بالطاقة الإيجابية والتقدم نحو الأهداف. حافظ على هذا الزخم.
          </Text>
        </SmartCard>
        {/* living connections from the memory graph */}
        <ConnectedLayer query={entry.title} domain="journal" />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
});
