// app/(tabs)/more/areas/[id]/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';

export default function AreaDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: areas, reload } = useAsync(() => repository.listAreas(), []);
  const { data: allHabits } = useAsync(() => repository.listHabits(), []);
  const area = areas.find((a) => a.id === id);

  const linkedHabits = allHabits.filter((h) => h.areaId === id);

  // Inline edit sheet (name / icon / color / description) → repository.updateArea.
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eEmoji, setEEmoji] = useState('🗺');
  const [eColor, setEColor] = useState('#7C6FFF');
  const openEdit = () => {
    if (!area) return;
    setEName(area.name);
    setEDesc(area.description ?? '');
    setEEmoji(area.emoji);
    setEColor(area.color);
    feedback.select();
    setEditing(true);
  };
  const saveEdit = async () => {
    if (!area || !eName.trim()) return;
    await repository.updateArea(area.id, { name: eName.trim(), emoji: eEmoji, color: eColor, description: eDesc.trim() });
    feedback.success();
    setEditing(false);
    reload();
  };

  if (!area) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.areas')} accent={c.areas} />
        <EmptyState emoji="🗺" title={t('common.empty')} />
      </View>
    );
  }

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={area.name}
        subtitle={area.description}
        accent={area.color}
        right={[
          { icon: 'create-outline', onPress: openEdit, color: c.t2 },
          { icon: 'add', onPress: () => router.push(`/(tabs)/more/areas/${area.id}/new-project`), color: c.accent },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard accent={area.color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[S.hero, { backgroundColor: area.color + '22' }]}>
              <Text style={{ fontSize: 34 }}>{area.emoji}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', gap: 18 }}>
              <Stat val={area.projects.length} label={t('areas.projects')} color={area.color} c={c} />
              <Stat val={linkedHabits.length} label={t('sections.habits')} color={c.habits} c={c} />
            </View>
          </View>
        </SmartCard>

        {/* Projects */}
        <Text style={[S.secTitle, { color: c.t2 }]}>{t('areas.projects')}</Text>
        {area.projects.length === 0 ? (
          <EmptyState
            emoji="📁"
            title={t('areas.no_projects')}
            action={{
              label: t('areas.new_proj'),
              onPress: () => router.push(`/(tabs)/more/areas/${area.id}/new-project`),
              color: area.color,
            }}
          />
        ) : (
          area.projects.map((proj) => (
            <Pressable
              key={proj.id}
              onPress={() => router.push(`/(tabs)/more/areas/${area.id}/project/${proj.id}`)}
            >
              <SmartCard accent={proj.color}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[S.projIcon, { backgroundColor: proj.color + '22' }]}>
                    <Text style={{ fontSize: 22 }}>{proj.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }}>{proj.name}</Text>
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>
                      📅 {proj.due} · {proj.goals.length} {t('areas.goals')}
                    </Text>
                  </View>
                  <Text style={{ color: proj.color, fontWeight: '800', fontSize: 16 }}>
                    {proj.progress}%
                  </Text>
                </View>
                <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 10 }]}>
                  <View style={[S.pFill, { width: `${proj.progress}%`, backgroundColor: proj.color }]} />
                </View>
              </SmartCard>
            </Pressable>
          ))
        )}

        {/* Linked habits */}
        {linkedHabits.length > 0 && (
          <>
            <Text style={[S.secTitle, { color: c.t2, marginTop: 4 }]}>{t('areas.linked_habits')}</Text>
            <SmartCard>
              {linkedHabits.map((h, i) => (
                <View
                  key={h.id}
                  style={[
                    S.habitRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                  <Text style={{ flex: 1, color: c.t1, fontSize: 14 }}>{h.name}</Text>
                  <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>🔥 {h.streak}</Text>
                </View>
              ))}
            </SmartCard>
          </>
        )}
      </ScrollView>

      {/* Edit Area sheet */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <Pressable style={S.backdrop} onPress={() => setEditing(false)} />
        <View style={[S.sheet, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
          <View style={[S.grab, { backgroundColor: c.b2 }]} />
          <Text style={{ color: c.t1, fontSize: 18, fontWeight: '800', marginBottom: 14 }}>
            {t('customize.edit_object')}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
            <View style={[S.preview, { backgroundColor: eColor + '22', borderColor: eColor }]}>
              <Text style={{ fontSize: 34 }}>{eEmoji}</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <EmojiPicker value={eEmoji} onChange={setEEmoji} color={eColor} />
            </View>
            <Text style={[S.fLabel, { color: c.t3 }]}>{t('customize.color')}</Text>
            <ColorPicker value={eColor} onChange={setEColor} />
            <Text style={[S.fLabel, { color: c.t3 }]}>{t('areas.new')}</Text>
            <TextInput
              value={eName}
              onChangeText={setEName}
              placeholder={t('areas.name_ph')}
              placeholderTextColor={c.t4}
              style={[S.input, { backgroundColor: c.bg3, borderColor: c.b1, color: c.t1 }]}
            />
            <Text style={[S.fLabel, { color: c.t3 }]}>{t('common.optional')}</Text>
            <TextInput
              value={eDesc}
              onChangeText={setEDesc}
              placeholder={t('areas.desc_ph')}
              placeholderTextColor={c.t4}
              multiline
              style={[S.input, { backgroundColor: c.bg3, borderColor: c.b1, color: c.t1, height: 76, textAlignVertical: 'top' }]}
            />
          </ScrollView>
          <Pressable
            onPress={saveEdit}
            style={[S.saveBtn, { backgroundColor: eName.trim() ? c.accent : c.bg3 }]}
            disabled={!eName.trim()}
          >
            <Text style={{ color: eName.trim() ? '#FFF' : c.t3, fontWeight: '800', fontSize: 16 }}>
              {t('common.save')}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const Stat = ({ val, label, color, c }: any) => (
  <View>
    <Text style={{ color, fontWeight: '800', fontSize: 22 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 12 }}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  hero: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  projIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, paddingBottom: 34 },
  grab: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  preview: { width: 72, height: 72, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  fLabel: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  saveBtn: { marginTop: 14, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
