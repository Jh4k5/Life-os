// app/settings/profile.tsx
// Edit your identity. The name here is what the app greets you by; it's stored
// locally (and synced to your profile row when an account is linked).
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/store/profileStore';

export default function ProfileScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useProfileStore();
  const [name, setName] = useState(profile.name);

  const save = () => {
    profile.setName(name.trim());
    router.back();
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title="الملف الشخصي" accent={c.accent} right={[{ icon: 'checkmark', onPress: save, color: c.accent }]} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 120 }}>
        <Input label={t('auth.name')} value={name} onChangeText={setName} />
        {profile.email ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.t2, fontSize: 13, fontWeight: '700' }}>{t('auth.email')}</Text>
            <Text style={{ color: c.t3, fontSize: 14 }}>{profile.email}</Text>
          </View>
        ) : null}
        <Button label={t('common.done')} onPress={save} color={c.accent} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({ screen: { flex: 1 } });
