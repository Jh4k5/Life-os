// app/(tabs)/more/areas/[id]/index.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockAreas, mockHabits } from '@/data/mock';

export default function AreaDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const area = mockAreas.find((a) => a.id === id);

  if (!area) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.areas')} accent={c.areas} />
        <EmptyState emoji="🗺" title={t('common.empty')} />
      </View>
    );
  }

  const linkedHabits = mockHabits.filter((h) => h.areaId === area.id);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={area.name}
        subtitle={area.description}
        accent={area.color}
        right={[
          { icon: 'add', onPress: () => router.push(`/(tabs)/more/areas/${area.id}/new-project`), color: c.accent },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard accent={area.color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[S.hero, { backgroundColor: area.color + '22' }]}>
              <Text style={{ fontSize: 34 }}>{area.emoji}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', gap: 18 }}>
              <Stat val={area.projects.length} label={t('areas.projects')} color={area.color} c={c} />
              <Stat val={linkedHabits.length} label={t('sections.habits')} color={c.habits} c={c} />
            </View>
          </View>
        </SmartCard>

        {/* Projects */}
        <Text style={[S.secTitle, { color: c.t2 }]}>{t('areas.projects')}</Text>
        {area.projects.length === 0 ? (
          <EmptyState
            emoji="📁"
            title={t('areas.no_projects')}
            action={{
              label: t('areas.new_proj'),
              onPress: () => router.push(`/(tabs)/more/areas/${area.id}/new-project`),
              color: area.color,
            }}
          />
        ) : (
          area.projects.map((proj) => (
            <Pressable
              key={proj.id}
              onPress={() => router.push(`/(tabs)/more/areas/${area.id}/project/${proj.id}`)}
            >
              <SmartCard accent={proj.color}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[S.projIcon, { backgroundColor: proj.color + '22' }]}>
                    <Text style={{ fontSize: 22 }}>{proj.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }}>{proj.name}</Text>
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>
                      📅 {proj.due} · {proj.goals.length} {t('areas.goals')}
                    </Text>
                  </View>
                  <Text style={{ color: proj.color, fontWeight: '800', fontSize: 16 }}>
                    {proj.progress}%
                  </Text>
                </View>
                <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 10 }]}>
                  <View style={[S.pFill, { width: `${proj.progress}%`, backgroundColor: proj.color }]} />
                </View>
              </SmartCard>
            </Pressable>
          ))
        )}

        {/* Linked habits */}
        {linkedHabits.length > 0 && (
          <>
            <Text style={[S.secTitle, { color: c.t2, marginTop: 4 }]}>{t('areas.linked_habits')}</Text>
            <SmartCard>
              {linkedHabits.map((h, i) => (
                <View
                  key={h.id}
                  style={[
                    S.habitRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                  <Text style={{ flex: 1, color: c.t1, fontSize: 14 }}>{h.name}</Text>
                  <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>🔥 {h.streak}</Text>
                </View>
              ))}
            </SmartCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Stat = ({ val, label, color, c }: any) => (
  <View>
    <Text style={{ color, fontWeight: '800', fontSize: 22 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 12 }}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  hero: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  projIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
