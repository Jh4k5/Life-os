// services/repository.ts
// Writes approved Review-Layer items to the real database. This closes the
// loop: capture → review → Apply → real rows. When Supabase is live AND a user
// is signed in, items are inserted into the right tables; otherwise it returns
// { demo: true } so the UI can stay honest ("applied locally") — never faked.
import type { DetectedItem, EntityType } from './types';
import { getClient } from './supabase';
import { notifications } from './notifications';
import { mockJournals, mockTasks, type JournalEntry, type TaskData } from '@/data/mock';
import { mockHabits } from '@/data/mock';
import type { HabitData } from '@/components/ui/HabitCard';

/** Best-effort proactive reminders for time-bound items (device only). */
function scheduleReminders(items: DetectedItem[]) {
  for (const it of items) {
    if (it.type === 'reminder' || it.type === 'appointment') {
      notifications.nudgeIn(60, 'تذكير من Life OS', it.title).catch(() => {});
    }
  }
}

/** Returns the signed-in user id, or null when running in local/demo mode. */
async function activeUser(): Promise<{ client: ReturnType<typeof getClient>; uid: string } | null> {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ? { client, uid: data.user.id } : null;
}

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
    scheduleReminders(accepted);
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

  // ── reads (real DB when signed in, else mock) ──
  async listJournal(): Promise<JournalEntry[]> {
    const session = await activeUser();
    if (!session) return mockJournals;
    const { data, error } = await session.client!
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return mockJournals;
    return data.map((r: any) => {
      const content: string = r.content ?? '';
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      return {
        id: r.id,
        title: r.title ?? '—',
        preview: content.slice(0, 90),
        date: (r.created_at ?? '').slice(0, 10),
        mood: r.mood ?? 'neutral',
        words,
        chars: content.length,
        pinned: !!r.pinned,
        tags: r.tags ?? [],
        areaId: r.area_id ?? null,
        projectId: null,
      };
    });
  },

  async listTasks(): Promise<TaskData[]> {
    const session = await activeUser();
    if (!session) return mockTasks;
    const { data, error } = await session.client!
      .from('tasks')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    if (error || !data) return mockTasks;
    return data.map((r: any) => ({
      id: r.id,
      title: r.title,
      priority: r.priority ?? 'medium',
      energy: r.energy ?? 'medium',
      due: r.due ?? null,
      area: null,
      project: null,
      done: !!r.done,
      subtasks: [],
    }));
  },

  async listHabits(): Promise<HabitData[]> {
    const session = await activeUser();
    if (!session) return mockHabits;
    const { data, error } = await session.client!.from('habits').select('*');
    if (error || !data) return mockHabits;
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      emoji: r.icon ?? '•',
      color: '#7C6FFF',
      type: r.type ?? 'checkbox',
      target: Number(r.target ?? 1),
      unit: r.unit ?? '',
      streak: 0,
      bestStreak: 0,
      todayValue: 0,
      done: false,
      timePref: r.time_pref ?? 'anytime',
      freq: r.freq ?? 'daily',
      areaId: r.area_id ?? null,
    }));
  },
};
