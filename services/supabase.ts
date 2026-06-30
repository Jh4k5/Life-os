// services/supabase.ts
// Real Supabase client for React Native + Expo (NOT the Next.js @supabase/ssr
// pattern — no cookies/middleware on a mobile app). Sessions persist via
// AsyncStorage. Env-driven: with EXPO_PUBLIC_SUPABASE_URL + ANON_KEY set, the
// client is live; otherwise the app runs on the local service implementations.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  // Supabase "publishable"/anon key — safe in the client (protected by RLS).
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const isSupabaseConfigured = () =>
  supabaseConfig.url.length > 0 && supabaseConfig.anonKey.length > 0;

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (_client) return _client;
  _client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // RN has no URL bar; disable URL-based session detection.
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
  return _client;
}

// NOTE: do not create the client at module load — that triggers async session
// loading and breaks static prerender. Always call getClient() at runtime.

// Storage buckets (created by schema.sql)
export const BUCKETS = {
  attachments: 'attachments', // images / PDFs / screenshots
  voice: 'voice', // raw audio uploads
} as const;
