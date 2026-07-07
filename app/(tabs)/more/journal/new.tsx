// app/(tabs)/more/journal/new.tsx
// Real save: entry → repository.addJournal → journal_signals extraction
// (the Intelligence Engine reads these for mood/stress trends).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { repository } from '@/services/repository';
import { intelligence } from '@/services/intelligence';

// Mood is data → semantic dot + label (same v3 language as the journal list).
const MOODS = ['great', 'good', 'neutral', 'bad', 'awful'] as const;
const moodColor = (m: string, c: any) =>
  m === 'great' || m === 'good' ? c.green : m === 'neutral' ? c.t3 : m === 'bad' ? c.orange : c.red;

export default function NewJournalScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const router = useRouter();
  const params = useLocalSearchParams<{ quick?: string }>();
  const [mode, setMode] = useState<'quick' | 'detailed'>(params.quick === 'true' ? 'quick' : 'detailed');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string>('good');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pinned, setPinned] = useState(false);

  const templates = [
    { key: 'reflect', label: t('journal.tpl_reflect') },
    { key: 'weekly', label: t('journal.tpl_weekly') },
    { key: 'problem', label: t('journal.tpl_problem') },
    { key: 'gratitude', label: t('journal.tpl_gratitude') },
    { key: 'free', label: t('journal.tpl_free') },
  ];

  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((p) => [...p, v]);
    setTagInput('');
  };

  const save = async () => {
    const text = content.trim();
    if (!text || saving) {
      if (!text) router.back();
      return;
    }
    setSaving(true);
    const entryId = await repository.addJournal({ title: title.trim(), content: text, mood, tags, pinned });
    // feed the Intelligence Engine (never blocks or breaks saving)
    intelligence.recordJournalSignals(entryId, text).catch(() => {});
    setSaving(false);
    router.back();
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('journal.new')}
        right={[
          { icon: pinned ? 'bookmark' : 'bookmark-outline', onPress: () => setPinned((p) => !p), color: c.accent },
          { icon: 'checkmark', onPress: save, color: c.accent },
        ]}
      />
      <ViewToggle
        options={[
          { key: 'quick', label: t('journal.quick'), icon: 'flash-outline' },
          { key: 'detailed', label: t('journal.new'), icon: 'create-outline' },
        ]}
        active={mode}
        onChange={(m) => setMode(m as 'quick' | 'detailed')}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        {mode === 'detailed' && (
          <TextInput
            style={[S.title, { color: c.t1, borderBottomColor: c.b1, textAlign }]}
            placeholder={t('journal.title_ph')}
            placeholderTextColor={c.t4}
            value={title}
            onChangeText={setTitle}
          />
        )}

        <TextInput
          style={[S.content, { backgroundColor: c.bg1, borderColor: c.b1, color: c.t1, textAlign }]}
          placeholder={t('journal.content_ph')}
          placeholderTextColor={c.t4}
          value={content}
          onChangeText={setContent}
          multiline
        />
        <Text style={{ color: c.t3, fontSize: 12, textAlign: 'right' }}>
          {t('journal.words', { n: words })}
        </Text>

        {mode === 'detailed' && (
          <>
            {/* Mood */}
            <Text style={[S.label, { color: c.t2 }]}>{t('journal.mood')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MOODS.map((m) => {
                const on = mood === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMood(m)}
                    style={[
                      S.moodBtn,
                      { backgroundColor: on ? c.accentDim : c.bg2, borderColor: on ? c.accent : c.b1 },
                    ]}
                  >
                    <View style={[S.moodDot, { backgroundColor: moodColor(m, c) }]} />
                    <Text style={{ color: on ? c.accent : c.t2, fontSize: 12, fontWeight: '600' }}>{t(`journal.mood_${m}`)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Tags */}
            <Text style={[S.label, { color: c.t2 }]}>{t('journal.tags')}</Text>
            <View style={[S.tagInputRow, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
              <TextInput
                style={{ flex: 1, color: c.t1, textAlign }}
                placeholder={t('journal.add_tag')}
                placeholderTextColor={c.t4}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <Pressable onPress={addTag}>
                <Ionicons name="add-circle" size={22} color={c.accent} />
              </Pressable>
            </View>
            {tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setTags((p) => p.filter((x) => x !== tag))}
                    style={[S.tag, { backgroundColor: c.bg3 }]}
                  >
                    <Text style={{ color: c.t2, fontSize: 12, fontWeight: '600' }}>#{tag} ✕</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Templates */}
            <Text style={[S.label, { color: c.t2 }]}>{t('journal.template')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {templates.map((tpl) => (
                <Pressable key={tpl.key} style={[S.tplChip, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
                  <Text style={{ color: c.t2, fontSize: 13 }}>{tpl.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable onPress={save} disabled={saving} style={[S.saveBtn, { backgroundColor: c.accent, opacity: saving ? 0.6 : 1 }]}>
          <Text style={S.saveTxt}>{t('common.save')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', borderBottomWidth: 1, paddingVertical: 8 },
  content: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 180, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '700' },
  moodBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1 },
  moodDot: { width: 9, height: 9, borderRadius: 4.5 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tplChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
