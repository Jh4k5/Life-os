// services/auth.ts
// Thin auth wrapper over Supabase Auth. When Supabase isn't configured it
// returns ok:true so the UI still flows (local/demo mode).
import { getClient, isSupabaseConfigured } from './supabase';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export const auth = {
  configured: isSupabaseConfigured,

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = getClient();
    if (!client) return { ok: true }; // demo mode
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    const client = getClient();
    if (!client) return { ok: true };
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async signOut(): Promise<void> {
    const client = getClient();
    if (client) await client.auth.signOut();
  },

  async currentUser() {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user ?? null;
  },
};
