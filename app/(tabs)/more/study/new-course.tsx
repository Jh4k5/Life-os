// app/(tabs)/more/study/new-course.tsx
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

export default function NewCourseScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [emoji, setEmoji] = useState('🎓');
  const [color, setColor] = useState('#F59E0B');

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('study.new_course')}
        accent={c.study}
        right={[{ icon: 'checkmark', onPress: () => router.back(), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 120 }}>
        <View style={[S.preview, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={{ fontSize: 40 }}>{emoji}</Text>
        </View>
        <EmojiPicker value={emoji} onChange={setEmoji} color={color} />
        <ColorPicker value={color} onChange={setColor} />
        <Input label={t('study.course_name')} value={name} onChangeText={setName} />
        <Input label={t('study.teacher')} value={teacher} onChangeText={setTeacher} />
        <Button label={t('common.create')} onPress={() => router.back()} color={color} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
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
