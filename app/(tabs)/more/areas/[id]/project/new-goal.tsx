// app/(tabs)/more/areas/[id]/project/new-goal.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScrollView } from 'react-native';
import { repository } from '@/services/repository';

export default function NewGoalScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id, pid } = useLocalSearchParams<{ id?: string; pid?: string }>();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const cleanDate = due.trim() && !Number.isNaN(Date.parse(due.trim())) ? due.trim() : null;
    await repository.addGoal({ title: title.trim(), areaId: id ?? null, projectId: pid ?? null, targetDate: cleanDate });
    router.back();
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('areas.new_goal')}
        accent={c.areas}
        right={[{ icon: 'checkmark', onPress: save, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 120 }}>
        <Input label={t('areas.new_goal')} value={title} onChangeText={setTitle} />
        <Input label={t('tasks.due')} value={due} onChangeText={setDue} placeholder="2026-07-10" />
        <Button label={t('common.create')} onPress={save} color={c.areas} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({ screen: { flex: 1 } });
