// app/(tabs)/more/areas/[id]/project/new-goal.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewGoalScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('areas.new_goal')}
        accent={c.areas}
        right={[{ icon: 'checkmark', onPress: () => router.back(), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 120 }}>
        <Input label={t('areas.new_goal')} value={title} onChangeText={setTitle} />
        <Input label={t('tasks.due')} value={due} onChangeText={setDue} placeholder="2026-07-10" />
        <Button label={t('common.create')} onPress={() => router.back()} color={c.areas} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({ screen: { flex: 1 } });
