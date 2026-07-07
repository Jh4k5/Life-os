// services/repository.ts
// LOCAL-FIRST data access. Every read and write goes to the on-device store
// (db/local) as the source of truth, so the UI is instant and works offline —
// no "applied locally / pending sync" states, no seed data for the user. The
// background sync layer (db/sync) mirrors dirty rows to Supabase when a session
// and network exist; the repository neither waits on nor exposes that.
import type { DetectedItem, EntityType } from './types';
import { notifications } from './notifications';
import * as db from '@/db/local';
import {
  SEED_AREAS,
  type JournalEntry,
  type TaskData,
  type ScheduleEvent,
  type Course,
  type LibraryItem,
  type Flashcard,
  type Area,
} from '@/data/mock';
import type { Meal, HealthDay, Workout, MealEstimate } from './types';
import { sm2, type SrsResult } from './srs';
import { analytics } from './analytics';
import { resolveDate } from './dateResolve';
import type { HabitData } from '@/components/ui/HabitCard';

export interface MemoryHit {
  id: string;
  type: string;
  label: string;
}

export interface PersistResult {
  saved: number;
  demo: boolean;
  errors: string[];
}

export interface Goal {
  id: string;
  title: string;
  detail: string;
  areaId: string | null;
  projectId: string | null;
  progress: number;
  done: boolean;
  targetDate: string | null;
}

export interface FocusSessionRow {
  id: string;
  task: string;
  durationMin: number;
  energyBefore: number;
  at: string; // ISO
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const dayISO = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);

/** Best-effort proactive reminders for time-bound items (device only). */
function scheduleReminders(items: DetectedItem[]) {
  for (const it of items) {
    if (it.type === 'reminder' || it.type === 'appointment') {
      notifications.nudgeIn(60, 'تذكير من Life OS', it.title).catch(() => {});
    }
  }
}

// Which local collection each detected entity flows into, plus the row shape.
function mapFor(type: EntityType): { coll: db.Collection; row: (i: DetectedItem) => Record<string, unknown> } | null {
  switch (type) {
    case 'journal':
    case 'note':
      return { coll: 'journal_entries', row: (i) => ({ title: i.title, content: i.source ?? i.title, mood: 'neutral', tags: [], pinned: false }) };
    case 'task':
    case 'checklist':
      return { coll: 'tasks', row: (i) => ({ title: i.title, priority: 'medium', energy: 'medium', done: false }) };
    case 'appointment':
    case 'reminder':
      return {
        coll: 'events',
        row: (i) => {
          const when = resolveDate(i.source ?? i.detail ?? i.title) ?? new Date(Date.now() + 3600_000);
          return { title: i.title, starts_at: when.toISOString(), all_day: false, source: 'event' };
        },
      };
    case 'habit':
      return { coll: 'habits', row: (i) => ({ name: i.title, icon: '•', type: 'checkbox', target: 1, freq: 'daily', time_pref: 'anytime' }) };
    case 'meal':
      return { coll: 'meals', row: (i) => ({ name: i.title, ai_estimated: false, eaten_at: db.nowISO() }) };
    case 'workout':
      return { coll: 'workouts', row: (i) => ({ name: i.title, mode: 'gym', done_at: db.nowISO() }) };
    case 'study_session':
      return { coll: 'study_courses', row: (i) => ({ name: i.title }) };
    case 'suggestion':
      return null;
    default:
      return null;
  }
}

/**
 * Insert ONE detected item into its collection and return the created primary
 * row id (or null if the type isn't persistable). Shared by persistAccepted
 * (bulk) and persistOne (single). Exam is cross-domain: a study record + a
 * calendar event on its real date — the exam row id is returned.
 */
async function insertDetected(item: DetectedItem): Promise<string | null> {
  if (item.type === 'suggestion') return null;
  if (item.type === 'exam') {
    const when = resolveDate(item.source ?? item.title);
    const exam = await db.insert('exams', {
      course_id: null,
      name: item.title,
      exam_date: when ? when.toISOString().slice(0, 10) : null,
      chapters_count: 0,
      ai_plan: [],
    });
    await db.insert('events', {
      title: `امتحان: ${item.title}`,
      starts_at: (when ?? new Date(Date.now() + 86_400_000)).toISOString(),
      all_day: true,
      source: 'exam',
    });
    return exam.id;
  }
  const map = mapFor(item.type);
  if (!map) return null;
  const row = await db.insert(map.coll, map.row(item));
  return row.id;
}

/** Deep-link into the section that now holds a just-added item. */
function routeFor(type: EntityType, id: string): string {
  switch (type) {
    case 'task':
    case 'checklist':
      return `/(tabs)/more/tasks/${id}`;
    case 'journal':
    case 'note':
      return `/(tabs)/more/journal/${id}`;
    case 'habit':
      return `/(tabs)/more/habits/${id}`;
    case 'study_session':
      return `/(tabs)/more/study/${id}`;
    case 'meal':
      return '/(tabs)/more/health';
    case 'workout':
      return '/(tabs)/more/exercise';
    case 'appointment':
    case 'reminder':
    case 'exam':
    default:
      return '/(tabs)/more/schedule';
  }
}

/** Grow the local memory graph: each item a node, chained relates_to. */
async function persistMemory(items: DetectedItem[]): Promise<void> {
  const linkable = items.filter((i) => i.type !== 'suggestion');
  if (linkable.length === 0) return;
  const ids: string[] = [];
  for (const i of linkable) {
    const node = await db.insert('memory_nodes', { type: i.type, label: i.title, data: i.source ? { source: i.source } : null });
    ids.push(node.id);
  }
  for (let k = 1; k < ids.length; k++) {
    await db.insert('memory_edges', { from_node: ids[k - 1], to_node: ids[k], relation: 'relates_to' });
  }
}

export const repository = {
  /** Persist every accepted item locally (real, instant). */
  async persistAccepted(items: DetectedItem[]): Promise<PersistResult> {
    const accepted = items.filter((i) => i.status === 'accepted' && i.type !== 'suggestion');
    scheduleReminders(accepted);
    let saved = 0;
    const errors: string[] = [];
    for (const item of accepted) {
      try {
        const id = await insertDetected(item);
        if (id) saved += 1;
      } catch (e: any) {
        errors.push(`${item.title}: ${e?.message ?? 'error'}`);
      }
    }
    await persistMemory(accepted);
    analytics.log('capture', 'applied', saved);
    // demo:false — the write is real (local), regardless of network/account.
    return { saved, demo: false, errors };
  },

  /**
   * Persist exactly ONE detected item immediately and return its created id +
   * a deep-link route into the section that now holds it. Powers the Review
   * card's per-item "Add" → "Added ✓ · View". Nothing else is written.
   */
  async persistOne(item: DetectedItem): Promise<{ id: string; route: string } | null> {
    scheduleReminders([item]);
    const id = await insertDetected(item);
    if (!id) return null;
    await persistMemory([item]);
    analytics.log('capture', 'applied', 1);
    return { id, route: routeFor(item.type, id) };
  },

  // ── Journal ──
  async listJournal(): Promise<JournalEntry[]> {
    const rows = await db.list('journal_entries');
    return rows.map((r: any) => {
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

  async addJournal(entry: { title: string; content: string; mood: string; tags: string[]; pinned: boolean }): Promise<string | null> {
    const row = await db.insert('journal_entries', {
      title: entry.title || entry.content.slice(0, 40),
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags,
      pinned: entry.pinned,
    });
    analytics.log('capture', 'journal_saved', entry.content.length);
    return row.id;
  },

  // ── Tasks ──
  async listTasks(): Promise<TaskData[]> {
    const rows = await db.find('tasks', (r) => !r.parent_id);
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      priority: r.priority ?? 'medium',
      energy: r.energy ?? 'medium',
      due: r.due ?? null,
      area: r.area ?? null,
      project: r.project ?? null,
      done: !!r.done,
      subtasks: r.subtasks ?? [],
    }));
  },

  async addTask(task: { title: string; priority?: string; energy?: string; due?: string | null; areaId?: string | null }): Promise<string> {
    const row = await db.insert('tasks', {
      title: task.title,
      priority: task.priority ?? 'medium',
      energy: task.energy ?? 'medium',
      due: task.due ?? null,
      area_id: task.areaId ?? null,
      done: false,
    });
    analytics.log('tasks', 'task_added');
    return row.id;
  },

  async toggleTask(id: string, done: boolean): Promise<void> {
    await db.update('tasks', id, { done });
    analytics.log('tasks', done ? 'task_done' : 'task_reopen');
  },

  async deleteTask(id: string): Promise<void> {
    await db.remove('tasks', id);
  },

  // ── Habits ──
  async listHabits(): Promise<HabitData[]> {
    const [habits, logs] = await Promise.all([db.list('habits'), db.list('habit_logs')]);
    const today = todayISO();
    return habits.map((r: any) => {
      const mine = logs.filter((l: any) => l.habit_id === r.id);
      const todayLog = mine.find((l: any) => l.day === today);
      // streak: consecutive days (ending today or yesterday) marked done
      let streak = 0;
      for (let off = 0; off < 400; off++) {
        const d = dayISO(off);
        const hit = mine.find((l: any) => l.day === d && l.done);
        if (hit) streak++;
        else if (off === 0) continue; // today not yet done doesn't break a prior streak
        else break;
      }
      const best = mine.filter((l: any) => l.done).length; // simple proxy
      return {
        id: r.id,
        name: r.name,
        emoji: r.icon ?? '•',
        color: r.color ?? '#7C6FFF',
        type: r.type ?? 'checkbox',
        target: Number(r.target ?? 1),
        unit: r.unit ?? '',
        streak,
        bestStreak: Math.max(streak, best),
        todayValue: Number(todayLog?.value ?? 0),
        done: !!todayLog?.done,
        timePref: r.time_pref ?? 'anytime',
        freq: r.freq ?? 'daily',
        areaId: r.area_id ?? null,
      };
    });
  },

  async addHabit(habit: { name: string; emoji?: string; color?: string; type?: string; target?: number; unit?: string; freq?: string; timePref?: string; areaId?: string | null }): Promise<string> {
    const row = await db.insert('habits', {
      name: habit.name,
      icon: habit.emoji ?? '•',
      color: habit.color ?? '#7C6FFF',
      type: habit.type ?? 'checkbox',
      target: habit.target ?? 1,
      unit: habit.unit ?? '',
      freq: habit.freq ?? 'daily',
      time_pref: habit.timePref ?? 'anytime',
      area_id: habit.areaId ?? null,
    });
    analytics.log('habits', 'habit_added');
    return row.id;
  },

  async updateHabit(id: string, patch: Partial<{ name: string; emoji: string; color: string; target: number; unit: string; freq: string; timePref: string }>): Promise<void> {
    const map: Record<string, unknown> = {};
    if (patch.name !== undefined) map.name = patch.name;
    if (patch.emoji !== undefined) map.icon = patch.emoji;
    if (patch.color !== undefined) map.color = patch.color;
    if (patch.target !== undefined) map.target = patch.target;
    if (patch.unit !== undefined) map.unit = patch.unit;
    if (patch.freq !== undefined) map.freq = patch.freq;
    if (patch.timePref !== undefined) map.time_pref = patch.timePref;
    await db.update('habits', id, map);
  },

  async deleteHabit(id: string): Promise<void> {
    await db.remove('habits', id);
  },

  /** Record today's value for a habit (upsert on habit_id+day). */
  async logHabit(habitId: string, value: number, done: boolean): Promise<void> {
    await db.upsert('habit_logs', { habit_id: habitId, day: todayISO() }, { value, done });
    analytics.log('habits', done ? 'habit_done' : 'habit_progress', value, { habitId });
  },

  /** Last N days of logs for one habit (oldest → newest). */
  async listHabitLogs(habitId: string, days = 91): Promise<{ day: string; done: boolean; value: number }[]> {
    const logs = await db.find('habit_logs', (r: any) => r.habit_id === habitId);
    const byDay = new Map(logs.map((l: any) => [l.day, l]));
    return Array.from({ length: days }, (_, i) => {
      const day = dayISO(days - 1 - i);
      const l: any = byDay.get(day);
      return { day, done: !!l?.done, value: Number(l?.value ?? 0) };
    });
  },

  // ── Study ──
  async listCourses(): Promise<Course[]> {
    const [courses, exams] = await Promise.all([db.list('study_courses'), db.list('exams')]);
    const examsByCourse = new Map<string, any[]>();
    for (const e of exams as any[]) {
      const list = examsByCourse.get(e.course_id) ?? [];
      list.push(e);
      examsByCourse.set(e.course_id, list);
    }
    return (courses as any[]).map((r) => ({
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

  async addCourse(course: { name: string; teacher?: string; color?: string; emoji?: string }): Promise<string> {
    const row = await db.insert('study_courses', {
      name: course.name,
      teacher: course.teacher ?? '',
      color: course.color ?? '#7C6FFF',
      icon: course.emoji ?? '',
      status: 'active',
      progress: 0,
    });
    analytics.log('study', 'course_added');
    return row.id;
  },

  async addExam(exam: { courseId: string | null; name: string; date: string | null; chaptersCount?: number }): Promise<string> {
    const row = await db.insert('exams', {
      course_id: exam.courseId,
      name: exam.name,
      exam_date: exam.date,
      chapters_count: exam.chaptersCount ?? 0,
      ai_plan: [],
    });
    analytics.log('study', 'exam_added');
    return row.id;
  },

  async listLibrary(): Promise<LibraryItem[]> {
    const rows = await db.list('learning_items');
    return (rows as any[]).map((r) => ({
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

  async addLibraryItem(item: { title: string; author?: string; type?: string; status?: string }): Promise<string> {
    const row = await db.insert('learning_items', {
      title: item.title,
      author: item.author ?? '',
      type: item.type ?? 'book',
      status: item.status ?? 'want_to_read',
      progress: 0,
    });
    return row.id;
  },

  // ── Flashcards (SM-2) ──
  async listDueFlashcards(courseId?: string): Promise<Flashcard[]> {
    const today = todayISO();
    const rows = await db.find('flashcards', (r: any) => (!courseId || r.course_id === courseId) && (r.due_date ?? today) <= today);
    return (rows as any[]).map((r) => ({
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

  async listFlashcards(courseId?: string): Promise<Flashcard[]> {
    const rows = await db.find('flashcards', (r: any) => !courseId || r.course_id === courseId);
    return (rows as any[]).map((r) => ({
      id: r.id,
      courseId: r.course_id ?? null,
      front: r.front,
      back: r.back,
      ease: Number(r.ease ?? 2.5),
      interval: Number(r.interval_days ?? 0),
      reps: Number(r.reps ?? 0),
      due: r.due_date ?? '',
    }));
  },

  async reviewFlashcard(card: Flashcard, grade: number): Promise<SrsResult> {
    const next = sm2({ ease: card.ease, interval: card.interval, reps: card.reps }, grade);
    await db.update('flashcards', card.id, { ease: next.ease, interval_days: next.interval, reps: next.reps, due_date: next.due });
    analytics.log('study', 'flashcard_review', grade);
    return next;
  },

  // ── Goals ──
  async listGoals(): Promise<Goal[]> {
    const rows = await db.list('goals');
    return (rows as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      detail: r.detail ?? '',
      areaId: r.area_id ?? null,
      projectId: r.project_id ?? null,
      progress: Number(r.progress ?? 0),
      done: !!r.done,
      targetDate: r.target_date ?? null,
    }));
  },

  async addGoal(goal: { title: string; detail?: string; areaId?: string | null; projectId?: string | null; targetDate?: string | null }): Promise<string> {
    const row = await db.insert('goals', {
      title: goal.title,
      detail: goal.detail ?? '',
      area_id: goal.areaId ?? null,
      project_id: goal.projectId ?? null,
      target_date: goal.targetDate ?? null,
      progress: 0,
      done: false,
    });
    analytics.log('goals', 'goal_added');
    return row.id;
  },

  async updateGoal(id: string, patch: Partial<{ progress: number; done: boolean; title: string; detail: string }>): Promise<void> {
    await db.update('goals', id, patch);
  },

  async deleteGoal(id: string): Promise<void> {
    await db.remove('goals', id);
  },

  // ── Health / Nutrition ──
  async getHealthToday(): Promise<HealthDay> {
    const today = todayISO();
    const row: any = (await db.find('health_metrics', (r: any) => r.day === today))[0];
    if (!row) return { day: today, weightKg: null, heightCm: null, waterMl: 0, sleepMin: 0, steps: 0 };
    return {
      day: row.day,
      weightKg: row.weight_kg ?? null,
      heightCm: row.height_cm ?? null,
      waterMl: Number(row.water_ml ?? 0),
      sleepMin: Number(row.sleep_min ?? 0),
      steps: Number(row.steps ?? 0),
    };
  },

  async upsertHealthToday(patch: Partial<{ waterMl: number; sleepMin: number; steps: number; weightKg: number }>): Promise<void> {
    const data: Record<string, unknown> = {};
    if (patch.waterMl !== undefined) data.water_ml = patch.waterMl;
    if (patch.sleepMin !== undefined) data.sleep_min = patch.sleepMin;
    if (patch.steps !== undefined) data.steps = patch.steps;
    if (patch.weightKg !== undefined) data.weight_kg = patch.weightKg;
    await db.upsert('health_metrics', { day: todayISO() }, data);
    analytics.log('health', 'metrics_upsert');
  },

  async listHealthWeek(): Promise<{ day: string; waterMl: number; sleepMin: number; steps: number }[]> {
    const rows = await db.list('health_metrics');
    const byDay = new Map((rows as any[]).map((r) => [r.day, r]));
    return Array.from({ length: 7 }, (_, i) => {
      const day = dayISO(6 - i);
      const r: any = byDay.get(day);
      return { day, waterMl: Number(r?.water_ml ?? 0), sleepMin: Number(r?.sleep_min ?? 0), steps: Number(r?.steps ?? 0) };
    });
  },

  async listMeals(): Promise<Meal[]> {
    const today = todayISO();
    const rows = await db.find('meals', (r: any) => (r.eaten_at ?? '').slice(0, 10) === today);
    return (rows as any[]).map((r) => ({
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

  async addMeal(est: MealEstimate): Promise<Meal> {
    const row = await db.insert('meals', {
      name: est.name,
      calories: est.calories,
      protein_g: est.protein,
      carbs_g: est.carbs,
      fat_g: est.fat,
      ai_estimated: est.aiEstimated,
      eaten_at: db.nowISO(),
    });
    analytics.log('health', 'meal_logged', est.calories, { ai: est.aiEstimated });
    return { ...est, id: row.id, eatenAt: row.eaten_at as string };
  },

  // ── Exercise ──
  async listWorkouts(): Promise<Workout[]> {
    const rows = await db.list('workouts');
    return (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name ?? '',
      mode: r.mode ?? 'gym',
      durationMin: Number(r.duration_min ?? 0),
      exercises: Array.isArray(r.exercises) ? r.exercises : [],
      doneAt: r.done_at,
    }));
  },

  async addWorkout(w: { name: string; mode?: 'gym' | 'home'; durationMin?: number }): Promise<string> {
    const row = await db.insert('workouts', {
      name: w.name,
      mode: w.mode ?? 'gym',
      duration_min: w.durationMin ?? 0,
      exercises: [],
      done_at: db.nowISO(),
    });
    return row.id;
  },

  // ── Events / calendar ──
  async listEvents(): Promise<ScheduleEvent[]> {
    const rows = await db.list('events');
    const hhmm = (iso?: string) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '00:00');
    return (rows as any[])
      .sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''))
      .map((r) => ({
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

  async addEvent(ev: { title: string; startsAt: string; endsAt?: string | null; allDay?: boolean; source?: string; location?: string }): Promise<string> {
    const row = await db.insert('events', {
      title: ev.title,
      starts_at: ev.startsAt,
      ends_at: ev.endsAt ?? null,
      all_day: !!ev.allDay,
      source: ev.source ?? 'event',
      location: ev.location ?? null,
    });
    return row.id;
  },

  // ── Memory recall (local graph) ──
  /** Persist a user-stated fact about themselves — feeds the AI's context. */
  async addMemoryNode(label: string, type = 'fact'): Promise<string> {
    const row = await db.insert('memory_nodes', { type, label, data: { source: 'user' } });
    analytics.log('capture', 'memory_node_added');
    return row.id;
  },

  async removeMemoryNode(id: string): Promise<void> {
    await db.remove('memory_nodes', id);
    const edges = (await db.find('memory_edges', (e: any) => e.from_node === id || e.to_node === id)) as any[];
    for (const e of edges) await db.remove('memory_edges', e.id);
  },

  async relatedMemory(query: string, limit = 6): Promise<MemoryHit[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const word = q.split(/\s+/).sort((a, b) => b.length - a.length)[0] ?? q;
    const nodes = (await db.list('memory_nodes')) as any[];
    const direct = nodes.filter((n) => String(n.label ?? '').toLowerCase().includes(word)).slice(0, limit);
    if (direct.length === 0) return [];
    const ids = new Set(direct.map((n) => n.id));
    const edges = (await db.list('memory_edges')) as any[];
    const nbrIds = new Set<string>();
    for (const e of edges) {
      if (ids.has(e.from_node) && !ids.has(e.to_node)) nbrIds.add(e.to_node);
      if (ids.has(e.to_node) && !ids.has(e.from_node)) nbrIds.add(e.from_node);
    }
    const hits: MemoryHit[] = direct.map((n) => ({ id: n.id, type: n.type, label: n.label }));
    for (const n of nodes) if (nbrIds.has(n.id)) hits.push({ id: n.id, type: n.type, label: n.label });
    return hits.slice(0, limit);
  },

  async searchMemory(query: string): Promise<MemoryHit[]> {
    const nodes = (await db.list('memory_nodes')) as any[];
    const q = query.trim().toLowerCase();
    const filtered = q ? nodes.filter((n) => String(n.label ?? '').toLowerCase().includes(q)) : nodes;
    return filtered.slice(0, 100).map((n) => ({ id: n.id, type: n.type, label: n.label }));
  },

  // ── Wellbeing / digital balance (user-defined, real) ──
  async listWellbeing(): Promise<{ id: string; name: string; type: 'healthy' | 'draining'; loggedToday: boolean }[]> {
    const today = todayISO();
    const acts = (await db.list('wellbeing_activities')) as any[];
    const logs = (await db.find('wellbeing_logs', (r: any) => r.day === today)) as any[];
    const loggedIds = new Set(logs.map((l) => l.activity_id));
    return acts
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
      .map((a) => ({ id: a.id, name: a.name ?? '', type: (a.type as 'healthy' | 'draining') ?? 'healthy', loggedToday: loggedIds.has(a.id) }));
  },

  async addWellbeingActivity(name: string, type: 'healthy' | 'draining'): Promise<string> {
    const row = await db.insert('wellbeing_activities', { name, type });
    analytics.log('wellbeing', 'activity_added', 0, { type });
    return row.id;
  },

  async removeWellbeingActivity(id: string): Promise<void> {
    await db.remove('wellbeing_activities', id);
    const logs = (await db.find('wellbeing_logs', (r: any) => r.activity_id === id)) as any[];
    for (const l of logs) await db.remove('wellbeing_logs', l.id);
  },

  /** Toggle today's log for an activity; returns the new logged state. */
  async toggleWellbeingToday(activityId: string): Promise<boolean> {
    const today = todayISO();
    const existing = (await db.find('wellbeing_logs', (r: any) => r.activity_id === activityId && r.day === today)) as any[];
    if (existing.length) {
      await db.remove('wellbeing_logs', existing[0].id);
      return false;
    }
    await db.insert('wellbeing_logs', { activity_id: activityId, day: today });
    return true;
  },

  /** Last 7 days net balance (healthy +1, draining −1) from real logs. */
  async wellbeingWeek(): Promise<number[]> {
    const acts = (await db.list('wellbeing_activities')) as any[];
    const typeOf = new Map(acts.map((a) => [a.id, a.type]));
    const logs = (await db.list('wellbeing_logs')) as any[];
    return Array.from({ length: 7 }, (_, i) => {
      const day = dayISO(6 - i);
      let net = 0;
      for (const l of logs) {
        if (l.day !== day) continue;
        net += typeOf.get(l.activity_id) === 'draining' ? -1 : 1;
      }
      return net;
    });
  },

  // ── Areas / Projects (starter content) ──
  // Areas ship as read-only starter structure (SEED_AREAS in data/mock). They
  // are not user-editable/persisted yet, so this is the single read seam every
  // Areas screen goes through — no screen imports the seed directly.
  async listAreas(): Promise<Area[]> {
    return SEED_AREAS as Area[];
  },

  async getArea(id: string): Promise<Area | null> {
    return (SEED_AREAS as Area[]).find((a) => a.id === id) ?? null;
  },

  // ── Focus sessions (real, persisted) ──
  async listFocusSessions(): Promise<FocusSessionRow[]> {
    const rows = (await db.list('focus_sessions')) as any[];
    return rows
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .map((r) => ({
        id: r.id,
        task: r.task ?? '',
        durationMin: Number(r.duration_min ?? 0),
        energyBefore: Number(r.energy_before ?? 0),
        at: r.created_at as string,
      }));
  },

  async addFocusSession(s: { task: string; durationMin: number; energyBefore: number }): Promise<string> {
    const row = await db.insert('focus_sessions', {
      task: s.task,
      duration_min: s.durationMin,
      energy_before: s.energyBefore,
    });
    analytics.log('focus', 'session_logged', s.durationMin);
    return row.id;
  },
};
