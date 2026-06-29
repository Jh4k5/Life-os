// app/(tabs)/more/areas/[id]/project/[pid].tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { TabPill } from '@/components/ui/TabPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockAreas } from '@/data/mock';

type Tab = 'goals' | 'tasks' | 'journals';

export default function ProjectDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id, pid } = useLocalSearchParams<{ id: string; pid: string }>();
  const area = mockAreas.find((a) => a.id === id);
  const project = area?.projects.find((p) => p.id === pid);
  const [tab, setTab] = useState<Tab>('goals');

  if (!area || !project) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('areas.projects')} accent={c.areas} />
        <EmptyState emoji="📁" title={t('common.empty')} />
      </View>
    );
  }

  const color = project.color;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={project.name} subtitle={`📅 ${project.due}`} accent={color} />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* progress hero */}
        <View style={{ padding: 16 }}>
          <SmartCard accent={color}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[S.hero, { backgroundColor: color + '22' }]}>
                <Text style={{ fontSize: 30 }}>{project.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontWeight: '700', fontSize: 16 }}>
                  {project.progress}% {t('study.completed')}
                </Text>
                <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 8 }]}>
                  <View style={[S.pFill, { width: `${project.progress}%`, backgroundColor: color }]} />
                </View>
              </View>
            </View>
          </SmartCard>
        </View>

        <TabPill
          tabs={[
            { key: 'goals', label: t('areas.goals'), emoji: '🎯' },
            { key: 'tasks', label: t('sections.tasks'), emoji: '✅' },
            { key: 'journals', label: t('sections.journal'), emoji: '📖' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as Tab)}
          accent={color}
        />

        <View style={{ padding: 16, gap: 10 }}>
          {tab === 'goals' &&
            (project.goals.length === 0 ? (
              <EmptyState emoji="🎯" title={t('common.empty')} />
            ) : (
              project.goals.map((g) => (
                <SmartCard key={g.id} accent={color}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.t1, fontSize: 15, fontWeight: '600', flex: 1 }}>
                      {g.title}
                    </Text>
                    <Text style={{ color, fontWeight: '800' }}>{g.progress}%</Text>
                  </View>
                  {g.due && <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>📅 {g.due}</Text>}
                  <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 8 }]}>
                    <View style={[S.pFill, { width: `${g.progress}%`, backgroundColor: color }]} />
                  </View>
                </SmartCard>
              ))
            ))}

          {tab === 'tasks' &&
            (project.tasks.length === 0 ? (
              <EmptyState emoji="✅" title={t('tasks.empty')} />
            ) : (
              <SmartCard>
                {project.tasks.map((tk, i) => (
                  <View
                    key={tk.id}
                    style={[
                      S.taskRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
                    ]}
                  >
                    <View
                      style={[
                        S.check,
                        { backgroundColor: tk.done ? color : 'transparent', borderColor: tk.done ? color : c.b2 },
                      ]}
                    >
                      {tk.done && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        color: tk.done ? c.t3 : c.t1,
                        fontSize: 14,
                        textDecorationLine: tk.done ? 'line-through' : 'none',
                      }}
                    >
                      {tk.title}
                    </Text>
                    {tk.due && <Text style={{ color: c.t3, fontSize: 12 }}>{tk.due}</Text>}
                  </View>
                ))}
              </SmartCard>
            ))}

          {tab === 'journals' &&
            (project.journals.length === 0 ? (
              <EmptyState emoji="📖" title={t('journal.empty')} />
            ) : (
              project.journals.map((j) => (
                <SmartCard key={j.id}>
                  <Text style={{ color: c.t1, fontSize: 15, fontWeight: '600' }}>{j.title}</Text>
                  <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>{j.date}</Text>
                </SmartCard>
              ))
            ))}

          {tab === 'goals' && (
            <Pressable
              onPress={() => router.push(`/(tabs)/more/areas/${area.id}/project/new-goal`)}
              style={[S.addBtn, { borderColor: color }]}
            >
              <Ionicons name="add" size={18} color={color} />
              <Text style={{ color, fontWeight: '600' }}>{t('areas.new_goal')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  hero: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
});
