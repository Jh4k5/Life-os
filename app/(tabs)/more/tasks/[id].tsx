// app/(tabs)/more/tasks/[id].tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockTasks, type SubTask } from '@/data/mock';

const ENERGY_ICON = { low: '🌙', medium: '☁', high: '⚡' };

export default function TaskDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = mockTasks.find((tk) => tk.id === id);
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks ?? []);

  if (!task) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.tasks')} accent={c.tasks} />
        <EmptyState emoji="✅" title={t('common.empty')} />
      </View>
    );
  }

  const toggleSub = (sid: string) =>
    setSubtasks((p) => p.map((s) => (s.id === sid ? { ...s, done: !s.done } : s)));

  const subDone = subtasks.filter((s) => s.done).length;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.tasks')} accent={c.tasks} right={[{ icon: 'create-outline', onPress: () => {}, color: c.tasks }]} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        <Text style={{ color: c.t1, fontSize: 22, fontWeight: '800' }}>{task.title}</Text>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Chip text={`${ENERGY_ICON[task.energy]} ${t('tasks.energy')}`} c={c} />
          {task.due && <Chip text={`📅 ${task.due}`} c={c} color={task.priority === 'urgent' ? c.red : undefined} />}
          {task.area && <Chip text={`🗺 ${task.area}`} c={c} />}
          {task.project && <Chip text={`📁 ${task.project}`} c={c} />}
        </View>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <>
            <Text style={[S.label, { color: c.t2 }]}>
              {t('tasks.subtask')} ({subDone}/{subtasks.length})
            </Text>
            <SmartCard>
              {subtasks.map((s, i) => (
                <Pressable
                  key={s.id}
                  onPress={() => toggleSub(s.id)}
                  style={[
                    S.subRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
                  ]}
                >
                  <View
                    style={[
                      S.check,
                      { backgroundColor: s.done ? c.tasks : 'transparent', borderColor: s.done ? c.tasks : c.b2 },
                    ]}
                  >
                    {s.done && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: s.done ? c.t3 : c.t1,
                      fontSize: 14,
                      textDecorationLine: s.done ? 'line-through' : 'none',
                    }}
                  >
                    {s.title}
                  </Text>
                </Pressable>
              ))}
            </SmartCard>
          </>
        )}

        {/* AI suggestion */}
        <SmartCard accent={c.ai_hub}>
          <Text style={{ color: c.ai_hub, fontWeight: '700', fontSize: 13 }}>🤖 {t('home.ai')}</Text>
          <Text style={{ color: c.t2, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            أفضل وقت لإنجاز هذه المهمة: صباحاً بين 9 و 11 — وقت ذروة تركيزك بناءً على سجلك.
          </Text>
        </SmartCard>
      </ScrollView>
    </View>
  );
}

const Chip = ({ text, c, color }: any) => (
  <View style={[S.chip, { backgroundColor: c.bg2 }]}>
    <Text style={{ color: color ?? c.t2, fontSize: 12 }}>{text}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
