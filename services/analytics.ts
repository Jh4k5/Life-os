// services/analytics.ts
// Lightweight event log → analytics_events. Fire-and-forget: every domain can
// record what happened (a capture applied, a card reviewed, a meal logged) so
// sections can later show real charts/heatmaps. No-op (silent) when signed out
// or offline — never throws, never blocks the UI.
import { getClient } from './supabase';

export type AnalyticsDomain =
  | 'capture'
  | 'habits'
  | 'tasks'
  | 'study'
  | 'learning'
  | 'health'
  | 'focus'
  | 'wellbeing'
  | 'goals';

export const analytics = {
  log(domain: AnalyticsDomain, name: string, value?: number, meta?: Record<string, unknown>) {
    // never await from callers — this must not slow the interaction
    void (async () => {
      try {
        const client = getClient();
        if (!client) return;
        const { data } = await client.auth.getUser();
        const uid = data.user?.id;
        if (!uid) return;
        await client.from('analytics_events').insert({
          user_id: uid,
          domain,
          name,
          value: value ?? null,
          meta: meta ?? null,
        });
      } catch {
        // swallow — analytics must never break the app
      }
    })();
  },
};
