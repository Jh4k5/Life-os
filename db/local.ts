// db/local.ts
// The app's LOCAL-FIRST source of truth. Every read and write hits this store
// first, so the UI updates instantly and works with no network — exactly like
// Apple Notes / Notion. A separate sync layer (db/sync.ts) pushes dirty rows to
// Supabase in the background and pulls remote changes; the UI never waits on it
// and never shows "saved locally / pending sync".
//
// Storage model: one AsyncStorage key per collection holding a JSON array of
// rows. Every row carries a stable uuid `id` (identical locally and in
// Supabase, so sync is a clean upsert), plus `created_at` / `updated_at`, and
// bookkeeping flags `_dirty` (needs push) and `_deleted` (tombstone) that the
// sync layer consumes and the repository strips before returning to the UI.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Collection =
  | 'journal_entries'
  | 'journal_signals'
  | 'tasks'
  | 'habits'
  | 'habit_logs'
  | 'study_courses'
  | 'exams'
  | 'goals'
  | 'learning_items'
  | 'flashcards'
  | 'meals'
  | 'health_metrics'
  | 'workouts'
  | 'events'
  | 'memory_nodes'
  | 'memory_edges'
  | 'insights'
  | 'wellbeing_activities'
  | 'wellbeing_logs'
  | 'focus_sessions';

export interface BaseRow {
  id: string;
  created_at: string;
  updated_at: string;
  _dirty?: boolean;
  _deleted?: boolean;
}
export type Row = BaseRow & Record<string, unknown>;

const NS = '@lifeos/db';
const keyFor = (c: Collection) => `${NS}:${c}`;

// RFC4122-ish v4 uuid. Not cryptographic, but unique enough for row ids and,
// crucially, a valid `uuid` value so Supabase accepts the same id on sync.
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const nowISO = () => new Date().toISOString();

// Small in-memory cache so repeated reads in a screen don't re-parse JSON.
const cache = new Map<Collection, Row[]>();

async function readAll(c: Collection): Promise<Row[]> {
  if (cache.has(c)) return cache.get(c)!;
  try {
    const raw = await AsyncStorage.getItem(keyFor(c));
    const rows: Row[] = raw ? JSON.parse(raw) : [];
    cache.set(c, rows);
    return rows;
  } catch {
    return [];
  }
}

async function writeAll(c: Collection, rows: Row[]): Promise<void> {
  cache.set(c, rows);
  try {
    await AsyncStorage.setItem(keyFor(c), JSON.stringify(rows));
  } catch {
    /* best-effort; the in-memory cache still reflects the change this session */
  }
}

/** Live (non-tombstoned) rows in a collection. */
export async function list(c: Collection): Promise<Row[]> {
  return (await readAll(c)).filter((r) => !r._deleted);
}

export async function get(c: Collection, id: string): Promise<Row | null> {
  return (await readAll(c)).find((r) => r.id === id && !r._deleted) ?? null;
}

export async function find(c: Collection, pred: (r: Row) => boolean): Promise<Row[]> {
  return (await list(c)).filter(pred);
}

/** Insert a new row (id/timestamps filled if absent). Marked dirty for sync. */
export async function insert(c: Collection, data: Record<string, unknown>): Promise<Row> {
  const rows = await readAll(c);
  const ts = nowISO();
  const row: Row = {
    id: (data.id as string) || uuid(),
    created_at: (data.created_at as string) || ts,
    updated_at: ts,
    _dirty: true,
    ...data,
  };
  rows.unshift(row);
  await writeAll(c, rows);
  return row;
}

/** Patch an existing row by id. Returns the updated row (or null). */
export async function update(c: Collection, id: string, patch: Record<string, unknown>): Promise<Row | null> {
  const rows = await readAll(c);
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...patch, updated_at: nowISO(), _dirty: true };
  await writeAll(c, rows);
  return rows[i];
}

/**
 * Insert or update by an arbitrary match (e.g. health by `day`, habit_logs by
 * `habit_id`+`day`). `match` selects the existing row; `data` is merged in.
 */
export async function upsert(
  c: Collection,
  match: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<Row> {
  const rows = await readAll(c);
  const i = rows.findIndex((r) => !r._deleted && Object.keys(match).every((k) => r[k] === match[k]));
  if (i !== -1) {
    rows[i] = { ...rows[i], ...match, ...data, updated_at: nowISO(), _dirty: true };
    await writeAll(c, rows);
    return rows[i];
  }
  const ts = nowISO();
  const row: Row = { id: uuid(), created_at: ts, updated_at: ts, _dirty: true, ...match, ...data };
  rows.unshift(row);
  await writeAll(c, rows);
  return row;
}

/** Soft-delete (tombstone) so the sync layer can propagate the delete. */
export async function remove(c: Collection, id: string): Promise<void> {
  const rows = await readAll(c);
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return;
  rows[i] = { ...rows[i], _deleted: true, _dirty: true, updated_at: nowISO() };
  await writeAll(c, rows);
}

/** Rows needing a push to the server (used by db/sync.ts). */
export async function dirty(c: Collection): Promise<Row[]> {
  return (await readAll(c)).filter((r) => r._dirty);
}

/** Mark rows clean after a successful push. */
export async function markClean(c: Collection, ids: string[]): Promise<void> {
  const set = new Set(ids);
  const rows = await readAll(c);
  let changed = false;
  for (const r of rows) if (set.has(r.id) && r._dirty) { r._dirty = false; changed = true; }
  if (changed) await writeAll(c, rows);
}

/** Merge server rows in (server wins when newer). Used by db/sync.ts pull. */
export async function mergeRemote(c: Collection, remote: Row[]): Promise<void> {
  const rows = await readAll(c);
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const rr of remote) {
    const local = byId.get(rr.id);
    if (!local || (!local._dirty && (rr.updated_at ?? '') >= (local.updated_at ?? ''))) {
      byId.set(rr.id, { ...rr, _dirty: false });
    }
  }
  await writeAll(c, [...byId.values()]);
}

const ALL_COLLECTIONS: Collection[] = [
  'journal_entries', 'journal_signals', 'tasks', 'habits', 'habit_logs', 'study_courses',
  'exams', 'goals', 'learning_items', 'flashcards', 'meals', 'health_metrics', 'workouts',
  'events', 'memory_nodes', 'memory_edges', 'insights',
  'wellbeing_activities', 'wellbeing_logs', 'focus_sessions',
];

/** A full snapshot of the user's data (for the real "Export data" setting). */
export async function exportAll(): Promise<{ exportedAt: string; app: string; data: Record<string, Row[]> }> {
  const data: Record<string, Row[]> = {};
  for (const c of ALL_COLLECTIONS) data[c] = await list(c);
  return { exportedAt: nowISO(), app: 'Life OS', data };
}

/** Wipe everything (used on sign-out / account delete). */
export async function clearAll(): Promise<void> {
  cache.clear();
  try {
    await AsyncStorage.multiRemove(ALL_COLLECTIONS.map(keyFor));
  } catch {
    /* ignore */
  }
}
