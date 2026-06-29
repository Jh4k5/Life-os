// app/(tabs)/more/areas/index.tsx
import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockAreas } from '@/data/mock';

export default function AreasScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.areas')}
        accent={c.areas}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/areas/new'), color: c.accent }]}
      />
      <FlatList
        data={mockAreas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}
        renderItem={({ item: area }) => {
          const projectCount = area.projects.length;
          const avg =
            projectCount > 0
              ? Math.round(area.projects.reduce((s, p) => s + p.progress, 0) / projectCount)
              : 0;
          return (
            <Pressable onPress={() => router.push(`/(tabs)/more/areas/${area.id}`)}>
              <SmartCard accent={area.color}>
                <View style={S.row}>
                  <View style={[S.icon, { backgroundColor: area.color + '22' }]}>
                    <Text style={{ fontSize: 26 }}>{area.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontWeight: '700', fontSize: 16 }}>{area.name}</Text>
                    <Text style={{ color: c.t2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {area.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.t3} />
                </View>
                <View style={S.statRow}>
                  <Text style={{ color: c.t3, fontSize: 12 }}>
                    📁 {projectCount} {t('areas.projects')}
                  </Text>
                  {projectCount > 0 && (
                    <Text style={{ color: area.color, fontSize: 12, fontWeight: '600' }}>{avg}%</Text>
                  )}
                </View>
                {projectCount > 0 && (
                  <View style={[S.pBg, { backgroundColor: c.b1 }]}>
                    <View style={[S.pFill, { width: `${avg}%`, backgroundColor: area.color }]} />
                  </View>
                )}
              </SmartCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            emoji="🗺"
            title={t('areas.no_projects')}
            action={{ label: t('areas.new'), onPress: () => router.push('/(tabs)/more/areas/new'), color: c.areas }}
          />
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
});
