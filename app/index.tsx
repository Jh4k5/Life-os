// app/index.tsx
// Session-aware entry. When Supabase is configured, route by real auth state:
// signed in → tabs, signed out → onboarding/auth. In local/demo mode (no
// backend) it goes straight to the app so nothing is blocked.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { auth } from '@/services/auth';
import { isSupabaseConfigured } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { c } = useTheme();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setTarget('/(tabs)/home');
      return;
    }
    auth.currentUser().then((user) => {
      setTarget(user ? '/(tabs)/home' : '/(auth)/welcome');
    });
  }, []);

  if (!target) return <View style={{ flex: 1, backgroundColor: c.bg0 }} />;
  return <Redirect href={target as never} />;
}
