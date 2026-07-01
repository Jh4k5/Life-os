// services/repository.ts
// Writes approved Review-Layer items to the real database. This closes the
// loop: capture → review → Apply → real rows. When Supabase is live AND a user
// is signed in, items are inserted into the right tables; otherwise it returns
// { demo: true } so the UI can stay honest ("applied locally") — never faked.
import type { DetectedItem, EntityType } from './types';
import { getClient } from './supabase';
import { notifications } from './notifications';
import { memory } from './memory';
import {
  mockJournals,
  mockTasks,
  mockEvents,
  mockCourses,
  mockLibrary,
  mockFlashcards,
  mockHealthToday,
  mockMeals,
  mockWorkouts,
  type JournalEntry,
  type TaskData,
  type ScheduleEvent,
  type Course,
  type LibraryItem,
  type Flashcard,
} from '@/data/mock';
import type { Meal, HealthDay, Workout, MealEstimate } from './types';
import { sm2, type SrsResult } from './srs';
import { analytics } from './analytics';

export interface MemoryHit {
  id: string;
  type: string;
  label: string;
}
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
      return {
        table: 'tasks',
        row: (i, uid) => ({ user_id: uid, title: i.title, priority: 'medium' }),
      };
    // Time-bound items land in the calendar (events), not the task wall.
    case 'appointment':
    case 'reminder':
    case 'exam':
      return {
        table: 'events',
        row: (i, uid) => ({
          user_id: uid,
          title: i.type === 'exam' ? `امتحان: ${i.title}` : i.title,
          // best-effort: place an hour out; real date parsing fills this later
          starts_at: new Date(Date.now() + 3600_000).toISOString(),
          all_day: i.type === 'exam',
          source: i.type === 'exam' ? 'exam' : 'event',
        }),
      };
    case 'habit':
      return {
        table: 'habits',
        row: (i, uid) => ({ user_id: uid, name: i.title, type: 'checkbox', target: 1, freq: 'daily', time_pref: 'anytime' }),
      };
    // Phase 2 domains fed straight from a brain-dump.
    case 'meal':
      return {
        table: 'meals',
        row: (i, uid) => ({ user_id: uid, name: i.title, ai_estimated: false }),
      };
    case 'workout':
      return {
        table: 'workouts',
        row: (i, uid) => ({ user_id: uid, name: i.title, mode: 'gym' }),
      };
    case 'study_session':
      return {
        table: 'study_sessions',
        row: (i, uid) => ({ user_id: uid, topic: i.title, minutes: 0 }),
      };
    case 'suggestion':
      return null; // a nudge, not a stored entity
    default:
      return null;
  }
}

/**
 * Grow the memory graph from accepted items: each becomes a node, and items
 * from the same capture are chained `relates_to` so the system can reason
 * across a person's life ("how does this affect the rest?"). Real DB when
 * signed in; the in-memory graph is the honest signed-out fallback.
 */
async function persistMemory(
  client: NonNullable<ReturnType<typeof getClient>> | null,
  uid: string | null,
  items: DetectedItem[],
): Promise<void> {
  const linkable = items.filter((i) => i.type !== 'suggestion');
  if (linkable.length === 0) return;

  if (!client || !uid) {
    // demo: keep an honest local graph (never faked, just not yet synced).
    const local = linkable.map((i) => memory.addNode({
      id: i.id,
      type: i.type,
      label: i.title,
      createdAt: Date.now(),
      data: i.source ? { source: i.source } : undefined,
    }));
    for (let k = 1; k < local.length; k++) memory.link(local[k - 1].id, local[k].id, 'relates_to');
    return;
  }

  const rows = linkable.map((i) => ({
    user_id: uid,
    type: i.type,
    label: i.title,
    data: i.source ? { source: i.source } : null,
  }));
  const { data, error } = await client.from('memory_nodes').insert(rows).select('id');
  if (error || !data) return;
  const ids: string[] = data.map((r: any) => r.id);
  const edges = [];
  for (let k = 1; k < ids.length; k++) {
    edges.push({ user_id: uid, from_node: ids[k - 1], to_node: ids[k], relation: 'relates_to' });
  }
  if (edges.length) await client.from('memory_edges').insert(edges);
}

export const repository = {
  /** Persist every accepted item. Suggestions are skipped (they're nudges). */
  async persistAccepted(items: DetectedItem[]): Promise<PersistResult> {
    const accepted = items.filter((i) => i.status === 'accepted' && i.type !== 'suggestion');
    scheduleReminders(accepted);
    const client = getClient();

    if (!client) {
      await persistMemory(null, null, accepted);
      return { saved: accepted.length, demo: true, errors: [] };
    }

    const { data: userData } = await client.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      await persistMemory(null, null, accepted);
      return { saved: accepted.length, demo: true, errors: [] };
    }

    let saved = 0;
    const errors: string[] = [];
    for (const item of accepted) {
      const map = tableFor(item.type);
      if (!map) continue;
      const { error } = await client.from(map.table).insert(map.row(item, uid));
      if (error) errors.push(`${item.title}: ${error.message}`);
      else saved += 1;
    }
    // Every accepted item also grows the memory graph (links them together).
    await persistMemory(client, uid, accepted);
    analytics.log('capture', 'applied', saved);
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

  async listCourses(): Promise<Course[]> {
    const session = await activeUser();
    if (!session) return mockCourses;
    const [courses, exams] = await Promise.all([
      session.client!.from('study_courses').select('*').order('created_at', { ascending: false }),
      session.client!.from('exams').select('*'),
    ]);
    if (courses.error || !courses.data) return mockCourses;
    const examsByCourse = new Map<string, any[]>();
    for (const e of exams.data ?? []) {
      const list = examsByCourse.get(e.course_id) ?? [];
      list.push(e);
      examsByCourse.set(e.course_id, list);
    }
    return courses.data.map((r: any) => ({
      id: r.id,
      name: r.name,
      emoji: r.icon ?? '',
      color: r.color ?? '#7C6FFF',
      teacher: r.teacher ?? '',
      progress: Number(r.progress ?? 0),
      status: r.status ?? 'active',
      totalStudyHours: Math.round(Number(r.total_study_minutes ?? 0) / 60),
      exams: (examsByCourse.get(r.id) ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.exam_date ?? '',
        chaptersCount: Number(e.chapters_count ?? 0),
        aiPlan: Array.isArray(e.ai_plan) ? e.ai_plan : [],
        studyHours: 0,
      })),
    }));
  },

  async listLibrary(): Promise<LibraryItem[]> {
    const session = await activeUser();
    if (!session) return mockLibrary;
    const { data, error } = await session.client!
      .from('learning_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return mockLibrary;
    return data.map((r: any) => ({
      id: r.id,
      title: r.title,
      author: r.author ?? '',
      type: r.type ?? 'book',
      status: r.status ?? 'want_to_read',
      progress: Number(r.progress ?? 0),
      rating: Number(r.rating ?? 0),
      notes: r.notes ?? '',
      tags: r.tags ?? [],
      areaId: r.area_id ?? null,
    }));
  },

  /** Flashcards due for review now (SM-2). Mock fallback when signed out. */
  async listDueFlashcards(courseId?: string): Promise<Flashcard[]> {
    const session = await activeUser();
    const today = new Date().toISOString().slice(0, 10);
    if (!session) {
      return mockFlashcards.filter((f) => (!courseId || f.courseId === courseId) && f.due <= today);
    }
    let q = session.client!
      .from('flashcards')
      .select('*')
      .lte('due_date', today)
      .order('due_date', { ascending: true });
    if (courseId) q = q.eq('course_id', courseId);
    const { data, error } = await q;
    if (error || !data) return mockFlashcards.filter((f) => f.due <= today);
    return data.map((r: any) => ({
      id: r.id,
      courseId: r.course_id ?? null,
      front: r.front,
      back: r.back,
      ease: Number(r.ease ?? 2.5),
      interval: Number(r.interval_days ?? 0),
      reps: Number(r.reps ?? 0),
      due: r.due_date ?? today,
    }));
  },

  /** Grade a flashcard (0..5) → persist the next SM-2 schedule. */
  async reviewFlashcard(card: Flashcard, grade: number): Promise<SrsResult> {
    const next = sm2({ ease: card.ease, interval: card.interval, reps: card.reps }, grade);
    const session = await activeUser();
    if (session) {
      await session.client!
        .from('flashcards')
        .update({ ease: next.ease, interval_days: next.interval, reps: next.reps, due_date: next.due })
        .eq('id', card.id);
    }
    analytics.log('study', 'flashcard_review', grade);
    return next;
  },

  // ── Health / Nutrition ──
  async getHealthToday(): Promise<HealthDay> {
    const session = await activeUser();
    if (!session) return mockHealthToday;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await session.client!
      .from('health_metrics')
      .select('*')
      .eq('day', today)
      .maybeSingle();
    if (error || !data) return { ...mockHealthToday, day: today, weightKg: null, heightCm: null, waterMl: 0, sleepMin: 0, steps: 0 };
    return {
      day: data.day,
      weightKg: data.weight_kg ?? null,
      heightCm: data.height_cm ?? null,
      waterMl: Number(data.water_ml ?? 0),
      sleepMin: Number(data.sleep_min ?? 0),
      steps: Number(data.steps ?? 0),
    };
  },

  async listMeals(): Promise<Meal[]> {
    const session = await activeUser();
    if (!session) return mockMeals;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await session.client!
      .from('meals')
      .select('*')
      .gte('eaten_at', `${today}T00:00:00`)
      .order('eaten_at', { ascending: true });
    if (error || !data) return mockMeals;
    return data.map((r: any) => ({
      id: r.id,
      name: r.name ?? '',
      calories: Number(r.calories ?? 0),
      protein: Number(r.protein_g ?? 0),
      carbs: Number(r.carbs_g ?? 0),
      fat: Number(r.fat_g ?? 0),
      aiEstimated: !!r.ai_estimated,
      eatenAt: r.eaten_at,
    }));
  },

  /** Log a meal. Returns the local row; persists when signed in. */
  async addMeal(est: MealEstimate): Promise<Meal> {
    const meal: Meal = { ...est, id: `local_${Date.now()}`, eatenAt: new Date().toISOString() };
    const session = await activeUser();
    if (session) {
      const { data } = await session.client!
        .from('meals')
        .insert({
          user_id: session.uid,
          name: est.name,
          calories: est.calories,
          protein_g: est.protein,
          carbs_g: est.carbs,
          fat_g: est.fat,
          ai_estimated: est.aiEstimated,
        })
        .select('id')
        .maybeSingle();
      if (data?.id) meal.id = data.id;
    }
    analytics.log('health', 'meal_logged', est.calories, { ai: est.aiEstimated });
    return meal;
  },

  // ── Exercise ──
  async listWorkouts(): Promise<Workout[]> {
    const session = await activeUser();
    if (!session) return mockWorkouts;
    const { data, error } = await session.client!
      .from('workouts')
      .select('*')
      .order('done_at', { ascending: false });
    if (error || !data) return mockWorkouts;
    return data.map((r: any) => ({
      id: r.id,
      name: r.name ?? '',
      mode: r.mode ?? 'gym',
      durationMin: Number(r.duration_min ?? 0),
      exercises: Array.isArray(r.exercises) ? r.exercises : [],
      doneAt: r.done_at,
    }));
  },

  // ── Memory recall ──
  async searchMemory(query: string): Promise<MemoryHit[]> {
    const session = await activeUser();
    if (!session) {
      const q = query.trim().toLowerCase();
      const nodes = q ? memory.search(query) : memory.all();
      return nodes.map((n) => ({ id: n.id, type: n.type, label: n.label }));
    }
    let req = session.client!.from('memory_nodes').select('id,type,label').order('created_at', { ascending: false }).limit(100);
    if (query.trim()) req = req.ilike('label', `%${query.trim()}%`);
    const { data, error } = await req;
    if (error || !data) return [];
    return data.map((r: any) => ({ id: r.id, type: r.type, label: r.label }));
  },

  async listEvents(): Promise<ScheduleEvent[]> {
    const session = await activeUser();
    if (!session) return mockEvents;
    const { data, error } = await session.client!
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true });
    if (error || !data) return mockEvents;
    const hhmm = (iso?: string) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '00:00');
    return data.map((r: any) => ({
      id: r.id,
      title: r.title,
      start: hhmm(r.starts_at),
      end: hhmm(r.ends_at ?? r.starts_at),
      color: r.color ?? '#7C6FFF',
      allDay: !!r.all_day,
      source: r.source ?? 'event',
      location: r.location ?? undefined,
    }));
  },
};
