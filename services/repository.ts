// services/repository.ts
// Writes approved Review-Layer items to the real database. This closes the
// loop: capture → review → Apply → real rows. When Supabase is live AND a user
// is signed in, items are inserted into the right tables; otherwise it returns
// { demo: true } so the UI can stay honest ("applied locally") — never faked.
import type { DetectedItem, EntityType } from './types';
import { getClient } from './supabase';

export interface PersistResult {
  saved: number;
  demo: boolean;
  errors: string[];
}

// Which table each detected entity flows into.
function tableFor(type: EntityType): { table: string; row: (i: DetectedItem, uid: string) => Record<string, unknown> } | null {
  switch (type) {
    case 'journal':
    case 'note':
      return {
        table: 'journal_entries',
        row: (i, uid) => ({ user_id: uid, title: i.title, content: i.source ?? i.title }),
      };
    case 'task':
    case 'checklist':
    case 'appointment':
    case 'reminder':
    case 'exam':
      return {
        table: 'tasks',
        row: (i, uid) => ({
          user_id: uid,
          title: i.type === 'exam' ? `مراجعة: ${i.title}` : i.title,
          priority: i.type === 'appointment' || i.type === 'reminder' ? 'high' : 'medium',
        }),
      };
    case 'habit':
      return {
        table: 'habits',
        row: (i, uid) => ({ user_id: uid, name: i.title, type: 'checkbox', target: 1, freq: 'daily', time_pref: 'anytime' }),
      };
    case 'suggestion':
      return null; // a nudge, not a stored entity
    default:
      return null;
  }
}

export const repository = {
  /** Persist every accepted item. Suggestions are skipped (they're nudges). */
  async persistAccepted(items: DetectedItem[]): Promise<PersistResult> {
    const accepted = items.filter((i) => i.status === 'accepted' && i.type !== 'suggestion');
    const client = getClient();

    if (!client) {
      return { saved: accepted.length, demo: true, errors: [] };
    }

    const { data: userData } = await client.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return { saved: accepted.length, demo: true, errors: [] };

    let saved = 0;
    const errors: string[] = [];
    for (const item of accepted) {
      const map = tableFor(item.type);
      if (!map) continue;
      const { error } = await client.from(map.table).insert(map.row(item, uid));
      if (error) errors.push(`${item.title}: ${error.message}`);
      else saved += 1;
    }
    return { saved, demo: false, errors };
  },
};
