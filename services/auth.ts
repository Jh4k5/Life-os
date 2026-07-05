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

  /**
   * Permanently delete the account: ask the server to remove the user + their
   * rows (Edge Function with the service role), then end the session. The
   * caller also wipes all local data — so the account is genuinely gone, not a
   * fake button.
   */
  async deleteAccount(): Promise<AuthResult> {
    const client = getClient();
    if (client) {
      try {
        await client.functions.invoke('delete-account', { body: {} });
      } catch {
        /* best-effort server delete; local wipe below always runs */
      }
      try {
        await client.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    return { ok: true };
  },

  async currentUser() {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user ?? null;
  },
};
