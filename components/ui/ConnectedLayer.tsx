// components/ui/ConnectedLayer.tsx
// The V3 "nothing lives alone" layer. Drop it into any detail screen and the
// entity surfaces its living connections: memory-graph matches + neighbors
// (repository.relatedMemory) and related insights from the Intelligence
// Engine. Renders nothing when there is genuinely nothing — quiet, honest.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { SmartCard } from '@/components/ui/SmartCard';
import { repository, type MemoryHit } from '@/services/repository';
import { intelligence, type Insight } from '@/services/intelligence';
import { feedback } from '@/services/feedback';

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

interface Props {
  /** Text that identifies the entity (its title/name) — used for graph matching. */
  query: string;
  /** Restrict related insights to this domain (e.g. 'study'). */
  domain?: Insight['domain'];
}

export const ConnectedLayer = ({ query, domain }: Props) => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [hits, setHits] = useState<MemoryHit[]>([]);
  const [related, setRelated] = useState<Insight[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [mem, ins] = await Promise.all([
        repository.relatedMemory(query),
        domain ? intelligence.listInsights() : Promise.resolve([]),
      ]);
      if (!alive) return;
      setHits(mem);
      setRelated(ins.filter((i) => i.domain === domain).slice(0, 2));
    })();
    return () => {
      alive = false;
    };
  }, [query, domain]);

  if (hits.length === 0 && related.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      <View style={[S.head, { flexDirection: rowDir }]}>
        <Ionicons name="git-network-outline" size={14} color={c.t3} />
        <Text style={{ color: c.t3, fontSize: 12, fontWeight: '700' }}>{t('connected.title')}</Text>
      </View>
      <SmartCard padSize="sm">
        <View style={{ gap: 2 }}>
          {related.map((ins) => (
            <View key={ins.id} style={[S.row, { flexDirection: rowDir }]}>
              <Ionicons name="sparkles-outline" size={15} color={c.accent} />
              <Text style={{ flex: 1, color: c.t1, fontSize: 13, fontWeight: '600', textAlign }} numberOfLines={2}>
                {ins.title}
              </Text>
            </View>
          ))}
          {hits.map((h) => {
            const go = h.route
              ? () => { feedback.tap(); router.push(h.route as never); }
              : undefined;
            return (
              <Pressable key={h.id} onPress={go} disabled={!go} style={[S.row, { flexDirection: rowDir }]}>
                <Ionicons name={TYPE_ICON[h.type] ?? 'ellipse-outline'} size={15} color={c.t2} />
                <Text style={{ flex: 1, color: c.t2, fontSize: 13, textAlign }} numberOfLines={1}>
                  {h.label}
                </Text>
                {go && <Ionicons name={rowDir === 'row-reverse' ? 'chevron-back' : 'chevron-forward'} size={13} color={c.t4} />}
                <Text style={{ color: c.t4, fontSize: 10 }}>{t(`memory.type_${h.type}`, { defaultValue: h.type })}</Text>
              </Pressable>
            );
          })}
        </View>
      </SmartCard>
    </View>
  );
};

const S = StyleSheet.create({
  head: { alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  row: { alignItems: 'center', gap: 9, paddingVertical: 7 },
});
