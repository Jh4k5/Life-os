// app/(tabs)/more/learning/new.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const TYPES = [
  { key: 'book', emoji: '📖', tkey: 'learning.type_book' },
  { key: 'podcast', emoji: '🎙', tkey: 'learning.type_pod' },
  { key: 'article', emoji: '📄', tkey: 'learning.type_article' },
  { key: 'video', emoji: '🎬', tkey: 'learning.type_video' },
  { key: 'course', emoji: '🎓', tkey: 'learning.type_course' },
  { key: 'link', emoji: '🔗', tkey: 'learning.type_link' },
] as const;

const STATUSES = [
  { key: 'want_to_read', tkey: 'learning.status_want' },
  { key: 'in_progress', tkey: 'learning.status_prog' },
  { key: 'completed', tkey: 'learning.status_done' },
] as const;

export default function NewLibraryItemScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<string>('book');
  const [status, setStatus] = useState<string>('want_to_read');
  const [rating, setRating] = useState(0);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('learning.new')}
        accent={c.learning}
        right={[{ icon: 'checkmark', onPress: () => router.back(), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 120 }}>
        <Text style={[S.label, { color: c.t2 }]}>{t('learning.new')}</Text>
        <View style={S.typeGrid}>
          {TYPES.map((tp) => (
            <Pressable
              key={tp.key}
              onPress={() => setType(tp.key)}
              style={[
                S.typeBtn,
                {
                  backgroundColor: type === tp.key ? c.learning + '20' : c.bg2,
                  borderColor: type === tp.key ? c.learning : c.b1,
                  borderWidth: type === tp.key ? 2 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{tp.emoji}</Text>
              <Text style={{ color: type === tp.key ? c.learning : c.t2, fontSize: 12, fontWeight: '600' }}>
                {t(tp.tkey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label={t('learning.new')} value={title} onChangeText={setTitle} />
        <Input label={t('study.teacher')} value={author} onChangeText={setAuthor} />

        <Text style={[S.label, { color: c.t2 }]}>{t('study.progress')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setStatus(s.key)}
              style={[
                S.chip,
                { backgroundColor: status === s.key ? c.learning : c.bg2, borderColor: status === s.key ? c.learning : c.b1 },
              ]}
            >
              <Text style={{ color: status === s.key ? '#FFF' : c.t2, fontWeight: '600', fontSize: 13 }}>
                {t(s.tkey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[S.label, { color: c.t2 }]}>{t('learning.rating')}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)}>
              <Text style={{ fontSize: 30, opacity: n <= rating ? 1 : 0.25 }}>⭐</Text>
            </Pressable>
          ))}
        </View>

        <Button label={t('common.create')} onPress={() => router.back()} color={c.learning} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { width: '31%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', gap: 6 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
