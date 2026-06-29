// app/(tabs)/more/areas/new.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';

export default function NewAreaScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🗺');
  const [color, setColor] = useState('#00D084');

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: 10 }}>
      <Text style={[S.label, { color: c.t2 }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('areas.new')}
        accent={c.areas}
        right={[{ icon: 'checkmark', onPress: () => router.back(), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 120 }}>
        <Sec title={t('areas.icon')}>
          <View style={[S.preview, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={{ fontSize: 40 }}>{emoji}</Text>
          </View>
          <EmojiPicker value={emoji} onChange={setEmoji} color={color} />
        </Sec>

        <Sec title={t('areas.color')}>
          <ColorPicker value={color} onChange={setColor} />
        </Sec>

        <Input label={t('areas.new')} value={name} onChangeText={setName} placeholder={t('areas.name_ph')} />
        <Input
          label={t('common.optional')}
          value={desc}
          onChangeText={setDesc}
          placeholder={t('areas.desc_ph')}
          multiline
        />

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
});
