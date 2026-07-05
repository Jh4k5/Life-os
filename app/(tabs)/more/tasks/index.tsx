// app/(tabs)/more/tasks/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { TaskCard } from '@/components/ui/TaskCard';
import { TabPill } from '@/components/ui/TabPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockTasks, type TaskData } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

type TView = 'list' | 'board' | 'energy';
const PRIORITY_ORDER: TaskData['priority'][] = ['urgent', 'high', 'medium', 'low', 'none'];

export default function TasksScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: loaded } = useAsync(() => repository.listTasks(), mockTasks, "tasks");
  const [tasks, setTasks] = useState<TaskData[]>(mockTasks);
  const [view, setView] = useState<TView>('list');
  const [quick, setQuick] = useState('');

  // hydrate local working copy whenever the source list changes (load / focus)
  React.useEffect(() => {
    setTasks(loaded);
  }, [loaded]);

  const toggle = (id: string) => {
    // Optimistic UI + real persistence, so the change survives a relaunch.
    let nowDone = false;
    setTasks((p) => p.map((tk) => {
      if (tk.id !== id) return tk;
      nowDone = !tk.done;
      return { ...tk, done: nowDone };
    }));
    if (nowDone) feedback.success();
    else feedback.tap();
    repository.toggleTask(id, nowDone).catch(() => {});
  };

  const addQuick = async () => {
    const v = quick.trim();
    if (!v) return;
    setQuick('');
    feedback.press();
    const id = await repository.addTask({ title: v, priority: 'medium', energy: 'medium' });
    setTasks((p) => [
      {
        id,
        title: v,
        priority: 'medium',
        energy: 'medium',
        due: null,
        area: null,
        project: null,
        done: false,
        subtasks: [],
      },
      ...p,
    ]);
  };

  const PRIORITY_LABEL: Record<TaskData['priority'], string> = {
    urgent: t('tasks.p_urgent'),
    high: t('tasks.p_high'),
    medium: t('tasks.p_med'),
    low: t('tasks.p_low'),
    none: t('tasks.p_none'),
  };
  const ENERGY_LABEL: Record<TaskData['energy'], string> = {
    high: t('tasks.e_high'),
    medium: t('tasks.e_med'),
    low: t('tasks.e_low'),
  };

  const active = tasks.filter((tk) => !tk.done);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.tasks')}
        accent={c.tasks}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/tasks/new'), color: c.accent }]}
      />

      {/* Quick capture */}
      <View style={[S.quick, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <Ionicons name="flash-outline" size={18} color={c.tasks} />
        <TextInput
          style={{ flex: 1, color: c.t1 }}
          placeholder={t('tasks.quick_ph')}
          placeholderTextColor={c.t4}
          value={quick}
          onChangeText={setQuick}
          onSubmitEditing={addQuick}
          returnKeyType="done"
        />
        {quick.trim().length > 0 && (
          <Pressable onPress={addQuick} style={[S.quickBtn, { backgroundColor: c.tasks }]}>
            <Ionicons name="add" size={18} color="#FFF" />
          </Pressable>
        )}
      </View>

      <TabPill
        tabs={[
          { key: 'list', label: t('tasks.view_list'), icon: 'list-outline' },
          { key: 'board', label: t('tasks.view_board'), icon: 'grid-outline' },
          { key: 'energy', label: t('tasks.view_energy'), icon: 'flash-outline' },
        ]}
        active={view}
        onChange={(v) => setView(v as TView)}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}>
        {active.length === 0 && tasks.every((tk) => tk.done) ? (
          <EmptyState icon="checkmark-done-circle-outline" title={t('tasks.empty')} />
        ) : view === 'list' ? (
          PRIORITY_ORDER.filter((p) => tasks.some((tk) => tk.priority === p)).map((p) => (
            <View key={p} style={{ gap: 4 }}>
              <Text style={[S.groupTitle, { color: c.t2 }]}>{PRIORITY_LABEL[p]}</Text>
              {tasks
                .filter((tk) => tk.priority === p)
                .map((tk) => (
                  <TaskCard key={tk.id} task={tk} onToggle={toggle} onPress={(id) => router.push(`/(tabs)/more/tasks/${id}`)} />
                ))}
            </View>
          ))
        ) : view === 'energy' ? (
          (['high', 'medium', 'low'] as TaskData['energy'][]).map((e) => (
            <View key={e} style={{ gap: 4 }}>
              <Text style={[S.groupTitle, { color: c.t2 }]}>{ENERGY_LABEL[e]}</Text>
              {tasks
                .filter((tk) => tk.energy === e && !tk.done)
                .map((tk) => (
                  <TaskCard key={tk.id} task={tk} onToggle={toggle} onPress={(id) => router.push(`/(tabs)/more/tasks/${id}`)} />
                ))}
            </View>
          ))
        ) : (
          // board (kanban) — todo / done columns
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                { key: 'todo', label: t('tasks.filter_all'), items: tasks.filter((tk) => !tk.done) },
                { key: 'done', label: t('tasks.filter_done'), items: tasks.filter((tk) => tk.done) },
              ] as const
            ).map((col) => (
              <View key={col.key} style={{ flex: 1, gap: 8 }}>
                <Text style={[S.groupTitle, { color: c.t2 }]}>
                  {col.label} ({col.items.length})
                </Text>
                {col.items.map((tk) => (
                  <Pressable key={tk.id} onPress={() => toggle(tk.id)}>
                    <SmartCard accent={col.key === 'done' ? c.green : c.tasks} padSize="sm">
                      <Text
                        style={{
                          color: tk.done ? c.t3 : c.t1,
                          fontSize: 13,
                          fontWeight: '600',
                          textDecorationLine: tk.done ? 'line-through' : 'none',
                        }}
                        numberOfLines={3}
                      >
                        {tk.title}
                      </Text>
                    </SmartCard>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  quickBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontSize: 13, fontWeight: '700', marginTop: 6, marginBottom: 2 },
});
