// app/(tabs)/more/ai-hub/index.tsx
// AI Hub = memory + Review Inbox + Trust Center. The Review Inbox reuses the
// exact same Review Layer as the Home result card and AI Studio.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { ReviewLayer } from '@/components/ai/ReviewLayer';
import type { DetectedItem, ReviewAction } from '@/services/types';
import { memory } from '@/services/memory';
import { repository } from '@/services/repository';

const INBOX: DetectedItem[] = [
  { id: 'r1', type: 'appointment', title: 'موعد طبيب الأسنان', detail: 'الخميس ٤:٠٠؟', confidence: 0.55, status: 'pending' },
  { id: 'r2', type: 'task', title: 'تجديد الاشتراك', detail: 'ذكرتَه بشكل عابر', confidence: 0.45, status: 'pending' },
  { id: 'r3', type: 'habit', title: 'مشي ٢٠ دقيقة', confidence: 0.5, status: 'pending' },
];

// seed a tiny memory graph so Deep Search returns real results
['تعلم الصينية', 'امتحان HSK', 'الصحة واللياقة', 'العادات الذرية'].forEach((label, i) =>
  memory.addNode({ id: `seed_${i}`, type: 'note', label, createdAt: Date.now() })
);

export default function AIHubScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [items, setItems] = useState<DetectedItem[]>(INBOX);
  const [query, setQuery] = useState('');

  const onAction = (id: string, action: ReviewAction) =>
    setItems((p) =>
      p
        .map((it) =>
          it.id === id ? { ...it, status: action === 'accept' ? 'accepted' : action === 'ignore' ? 'ignored' : it.status } : it
        )
        .filter((it) => !(it.id === id && action === 'delete'))
    );
  const applyAll = async () => {
    const next = items.map((it) => (it.status === 'pending' ? { ...it, status: 'accepted' as const } : it));
    setItems(next);
    await repository.persistAccepted(next);
  };

  const results = query.trim() ? memory.search(query) : [];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.ai_hub')}
        accent={c.accent}
        right={[{ icon: 'shield-checkmark-outline', onPress: () => router.push('/trust-center'), color: c.t2 }]}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        {/* Deep search in my life */}
        <View style={[S.search, { backgroundColor: c.bg2, borderColor: c.b1, flexDirection: rowDir }]}>
          <Ionicons name="search-outline" size={18} color={c.t3} />
          <TextInput
            style={[S.searchInput, { color: c.t1, textAlign }]}
            placeholder="ابحث في حياتك… (متى آخر موعد؟ وين خطة HSK؟)"
            placeholderTextColor={c.t4}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {results.length > 0 && (
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
        )}

        {/* Review Inbox — same Review Layer */}
        <View style={[S.inboxHead, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>صندوق المراجعة</Text>
          {items.some((i) => i.status === 'pending') && (
            <View style={[S.count, { backgroundColor: c.accent }]}>
              <Text style={S.countTxt}>{items.filter((i) => i.status === 'pending').length}</Text>
            </View>
          )}
        </View>
        {items.length > 0 ? (
          <ReviewLayer items={items} onAction={onAction} onApplyAll={applyAll} />
        ) : (
          <Text style={{ color: c.t3, fontSize: 14, textAlign }}>لا شيء بانتظار المراجعة ✨</Text>
        )}

        {/* Memory + Trust */}
        <Text style={[S.label, { color: c.t3, textAlign }]}>{t('ai_hub.memory')}</Text>
        <SmartCard>
          <View style={[S.row, { flexDirection: rowDir }]}>
            <Ionicons name="git-network-outline" size={18} color={c.accent} />
            <Text style={{ flex: 1, color: c.t2, fontSize: 13, lineHeight: 21, textAlign }}>
              يربط الذكاء أشخاصك وملفاتك ومشاريعك وعاداتك ليفهم «كيف يؤثر هذا على بقية حياتك» — لا مجرد تخزين.
            </Text>
          </View>
        </SmartCard>
        <Pressable onPress={() => router.push('/trust-center')}>
          <SmartCard>
            <View style={[S.row, { flexDirection: rowDir }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={c.green} />
              <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>مركز الثقة والخصوصية</Text>
              <Ionicons name="chevron-forward" size={16} color={c.t3} />
            </View>
          </SmartCard>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  search: { alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  resRow: { alignItems: 'center', gap: 10, padding: 14 },
  inboxHead: { alignItems: 'center', gap: 8, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700' },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  countTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  row: { gap: 12, alignItems: 'center' },
});
