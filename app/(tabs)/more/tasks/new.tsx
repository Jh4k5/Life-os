// app/(tabs)/more/tasks/new.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { mockAreas, type TaskData } from '@/data/mock';
import { repository } from '@/services/repository';

const PRIORITIES: { key: TaskData['priority']; dot: string; tkey: string }[] = [
  { key: 'none', dot: '⚪', tkey: 'tasks.p_none' },
  { key: 'low', dot: '🟢', tkey: 'tasks.p_low' },
  { key: 'medium', dot: '🔵', tkey: 'tasks.p_med' },
  { key: 'high', dot: '🟡', tkey: 'tasks.p_high' },
  { key: 'urgent', dot: '🔴', tkey: 'tasks.p_urgent' },
];

const ENERGIES: { key: TaskData['energy']; tkey: string }[] = [
  { key: 'low', tkey: 'tasks.e_low' },
  { key: 'medium', tkey: 'tasks.e_med' },
  { key: 'high', tkey: 'tasks.e_high' },
];

export default function NewTaskScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskData['priority']>('medium');
  const [energy, setEnergy] = useState<TaskData['energy']>('medium');
  const [due, setDue] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await repository.addTask({ title: title.trim(), priority, energy, due: due.trim() || null, areaId });
    router.back();
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('tasks.new')}
        accent={c.tasks}
        right={[{ icon: 'checkmark', onPress: save, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 120 }}>
        <Input label={t('tasks.title_ph')} value={title} onChangeText={setTitle} />
        <Input label={t('tasks.desc_ph')} value={desc} onChangeText={setDesc} multiline />

        {/* Priority */}
        <Text style={[S.label, { color: c.t2 }]}>{t('tasks.priority')}</Text>
        <View style={S.row}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPriority(p.key)}
              style={[
                S.pBtn,
                { backgroundColor: priority === p.key ? c.tasks + '20' : c.bg2, borderColor: priority === p.key ? c.tasks : c.b1, borderWidth: priority === p.key ? 2 : 1 },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{p.dot}</Text>
              <Text style={{ color: c.t2, fontSize: 11, marginTop: 2 }}>{t(p.tkey)}</Text>
            </Pressable>
          ))}
        </View>

        {/* Energy */}
        <Text style={[S.label, { color: c.t2 }]}>{t('tasks.energy')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {ENERGIES.map((e) => (
            <Pressable
              key={e.key}
              onPress={() => setEnergy(e.key)}
              style={[
                S.eBtn,
                { backgroundColor: energy === e.key ? c.tasks : c.bg2, borderColor: energy === e.key ? c.tasks : c.b1 },
              ]}
            >
              <Text style={{ color: energy === e.key ? '#FFF' : c.t2, fontSize: 12, fontWeight: '600' }}>
                {t(e.tkey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label={t('tasks.due')} value={due} onChangeText={setDue} placeholder={t('tasks.no_due')} />

        {/* Link area */}
        <Text style={[S.label, { color: c.t2 }]}>{t('common.link_area')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => setAreaId(null)}
            style={[S.areaChip, { backgroundColor: !areaId ? c.accent + '20' : c.bg2, borderColor: !areaId ? c.accent : c.b1 }]}
          >
            <Text style={{ color: !areaId ? c.accent : c.t2, fontSize: 13 }}>—</Text>
          </Pressable>
          {mockAreas.map((area) => (
            <Pressable
              key={area.id}
              onPress={() => setAreaId(area.id)}
              style={[S.areaChip, { backgroundColor: areaId === area.id ? area.color + '20' : c.bg2, borderColor: areaId === area.id ? area.color : c.b1 }]}
            >
              <Text style={{ fontSize: 14 }}>{area.emoji}</Text>
              <Text style={{ color: areaId === area.id ? area.color : c.t2, fontSize: 13 }}>{area.name}</Text>
            </Pressable>
          ))}
        </View>

        <Button label={t('common.create')} onPress={save} color={c.tasks} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 6 },
  pBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  eBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
});
