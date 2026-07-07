// app/(tabs)/more/study/new-exam.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SmartCard } from '@/components/ui/SmartCard';
import { repository } from '@/services/repository';

export default function NewExamScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [chapters, setChapters] = useState(4);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const cleanDate = date.trim() && !Number.isNaN(Date.parse(date.trim())) ? date.trim() : null;
    await repository.addExam({ courseId: courseId ?? null, name: name.trim(), date: cleanDate, chaptersCount: chapters });
    // Cross-domain: a dated exam also lands on the calendar.
    if (cleanDate) {
      await repository.addEvent({ title: t('study.exam_event_title', { name: name.trim() }), startsAt: new Date(cleanDate).toISOString(), allDay: true, source: 'exam' });
    }
    router.back();
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('study.new_exam')}
        accent={c.study}
        right={[{ icon: 'checkmark', onPress: save, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 120 }}>
        <Input label={t('study.exam_name')} value={name} onChangeText={setName} />
        <Input label={t('study.exam_date')} value={date} onChangeText={setDate} placeholder="2026-07-10" />

        <Text style={[S.label, { color: c.t2 }]}>{t('study.chapters')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            onPress={() => setChapters((v) => Math.max(1, v - 1))}
            style={[S.btn, { borderColor: c.b2 }]}
          >
            <Ionicons name="remove" size={20} color={c.t2} />
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: '800', color: c.t1, minWidth: 50, textAlign: 'center' }}>
            {chapters}
          </Text>
          <Pressable
            onPress={() => setChapters((v) => v + 1)}
            style={[S.btn, { backgroundColor: c.study, borderColor: c.study }]}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* AI plan teaser */}
        <SmartCard accent={c.study}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
            <Text style={{ color: c.study, fontWeight: '600', fontSize: 13, flex: 1 }}>
              {t('study.exam_ai_note')}
            </Text>
          </View>
        </SmartCard>

        <Button label={t('study.gen_plan')} icon="sparkles-outline" onPress={save} color={c.study} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  btn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
