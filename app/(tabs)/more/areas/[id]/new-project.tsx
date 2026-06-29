// app/(tabs)/more/areas/[id]/new-project.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';

const STATUSES = ['active', 'completed', 'paused'] as const;

export default function NewProjectScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('#F59E0B');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('active');

  const statusLabel: Record<string, string> = {
    active: t('study.active'),
    completed: t('study.completed'),
    paused: t('study.paused'),
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('areas.new_proj')}
        accent={color}
        right={[{ icon: 'checkmark', onPress: () => router.back(), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 120 }}>
        <View style={[S.preview, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={{ fontSize: 40 }}>{emoji}</Text>
        </View>
        <EmojiPicker value={emoji} onChange={setEmoji} color={color} />
        <ColorPicker value={color} onChange={setColor} />
        <Input label={t('areas.new_proj')} value={name} onChangeText={setName} />

        <Text style={[S.label, { color: c.t2 }]}>{t('study.progress')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={[
                S.chip,
                {
                  backgroundColor: status === s ? color : c.bg2,
                  borderColor: status === s ? color : c.b1,
                },
              ]}
            >
              <Text style={{ color: status === s ? '#FFF' : c.t2, fontWeight: '600', fontSize: 13 }}>
                {statusLabel[s]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button label={t('common.create')} onPress={() => router.back()} color={color} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
