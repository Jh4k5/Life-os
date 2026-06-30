// services/supabase.ts
// Real backend seam. The whole app reaches the server through this module.
// It is env-driven and lazy: when EXPO_PUBLIC_SUPABASE_URL / ANON_KEY are set
// and `@supabase/supabase-js` is installed, getClient() returns a live client;
// otherwise the app runs on the local service implementations. This is a real
// interface to grow into — never a throwaway stub.
//
// To go live:
//   1) npm i @supabase/supabase-js
//   2) set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
//   3) apply supabase/schema.sql
//   4) flip the implementations in aiService / captureService / scheduleService
//      to call the Edge Functions instead of the local logic.

export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const isSupabaseConfigured = () =>
  supabaseConfig.url.length > 0 && supabaseConfig.anonKey.length > 0;

let _client: any = null;

/** Lazily creates the Supabase client if configured & the SDK is present. */
export function getClient(): any | null {
  if (!isSupabaseConfigured()) return null;
  if (_client) return _client;
  try {
    // Required lazily so the app builds before the SDK is installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    _client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return _client;
  } catch {
    return null;
  }
}

// ── Storage buckets (created by schema.sql) ──
export const BUCKETS = {
  attachments: 'attachments', // images / PDFs / screenshots
  voice: 'voice', // raw audio uploads
} as const;
