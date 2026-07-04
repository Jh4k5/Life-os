// app/(auth)/sign-up.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { auth } from '@/services/auth';
import { useProfileStore } from '@/store/profileStore';

export default function SignUpScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = useProfileStore();

  const submit = async () => {
    if (!name.trim()) {
      setError('أدخل اسمك');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await auth.signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (res.ok) {
      // Local-first identity: the app greets you by your real name and is
      // personal immediately, whether or not the account finishes verifying.
      profile.setName(name.trim());
      profile.setEmail(email.trim() || null);
      profile.setOnboarded(true);
      router.replace('/(tabs)/home');
    } else setError(res.error ?? 'تعذّر إنشاء الحساب');
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0, paddingTop: top + 40 }]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: c.t1, letterSpacing: -0.5 }}>Life OS</Text>
          <Text style={{ color: c.t2, fontSize: 14 }}>{t('auth.welcome_sub')}</Text>
        </View>

        <Input label={t('auth.name')} value={name} onChangeText={setName} />
        <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />

        {error && <Text style={{ color: c.red, fontSize: 13, textAlign: 'center' }}>{error}</Text>}

        <Button label={t('auth.sign_up')} onPress={submit} loading={loading} />

        <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={{ alignItems: 'center', paddingVertical: 6 }}>
          <Text style={{ color: c.t2, fontSize: 14 }}>
            {t('auth.have_account')} <Text style={{ color: c.accent, fontWeight: '700' }}>{t('auth.sign_in')}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({ screen: { flex: 1 } });
