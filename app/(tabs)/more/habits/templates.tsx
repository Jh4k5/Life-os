// app/(tabs)/more/habits/templates.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { habitTemplates } from '@/data/mock';

const CATEGORIES: { key: keyof typeof habitTemplates; emoji: string; tkey: string }[] = [
  { key: 'health', emoji: '💚', tkey: 'habits.cat_health' },
  { key: 'productivity', emoji: '⚡', tkey: 'habits.cat_prod' },
  { key: 'learning', emoji: '📚', tkey: 'habits.cat_learn' },
  { key: 'discipline', emoji: '🎯', tkey: 'habits.cat_disc' },
];

const TYPE_ICON: Record<string, string> = {
  checkbox: '☑',
  counter: '🔢',
  timer: '⏱',
  stopwatch: '⏱',
  quantity: '📏',
};

export default function TemplatesScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('habits.templates')} accent={c.habits} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 110 }}>
        {CATEGORIES.map((cat) => (
          <View key={cat.key} style={{ gap: 8 }}>
            <Text style={[S.catTitle, { color: c.t2 }]}>
              {cat.emoji} {t(cat.tkey)}
            </Text>
            {habitTemplates[cat.key].map((tpl, i) => (
              <Pressable key={i} onPress={() => router.push('/(tabs)/more/habits/new')}>
                <SmartCard accent={tpl.color} padSize="sm">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[S.icon, { backgroundColor: tpl.color + '22' }]}>
                      <Text style={{ fontSize: 22 }}>{tpl.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.t1, fontWeight: '600', fontSize: 15 }}>{tpl.name}</Text>
                      <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>
                        {TYPE_ICON[tpl.type]} {tpl.target > 1 ? `${tpl.target} ${tpl.unit ?? ''}` : ''} ·{' '}
                        {tpl.freq === 'daily' ? t('habits.daily') : t('habits.weekly')}
                      </Text>
                    </View>
                    <View style={[S.addPill, { backgroundColor: tpl.color + '20' }]}>
                      <Text style={{ color: tpl.color, fontWeight: '700', fontSize: 13 }}>+</Text>
                    </View>
                  </View>
                </SmartCard>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  catTitle: { fontSize: 14, fontWeight: '700' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  addPill: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
