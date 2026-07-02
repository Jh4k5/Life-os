// services/search.ts
// One search across the user's whole life — tasks, journal, study, learning,
// and the memory graph. Reuses the repository reads (real DB when signed in,
// mock fallback signed out) and unifies them into routable hits.
import { repository } from './repository';
import { intelligence } from './intelligence';

export type SearchKind =
  | 'task'
  | 'journal'
  | 'course'
  | 'library'
  | 'memory'
  | 'event'
  | 'meal'
  | 'workout'
  | 'insight';

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  route: string;
  icon: string; // Ionicon name
}

const norm = (s: string) => (s ?? '').toLowerCase();

export async function globalSearch(query: string): Promise<SearchHit[]> {
  const q = norm(query).trim();
  if (!q) return [];

  const [tasks, journals, courses, library, memory, events, meals, workouts, insights] = await Promise.all([
    repository.listTasks(),
    repository.listJournal(),
    repository.listCourses(),
    repository.listLibrary(),
    repository.searchMemory(query),
    repository.listEvents(),
    repository.listMeals(),
    repository.listWorkouts(),
    intelligence.listInsights(),
  ]);

  const hits: SearchHit[] = [];

  for (const tk of tasks) {
    if (norm(tk.title).includes(q)) {
      hits.push({ id: tk.id, kind: 'task', title: tk.title, subtitle: tk.done ? '✓' : undefined, route: `/(tabs)/more/tasks/${tk.id}`, icon: 'checkmark-circle-outline' });
    }
  }
  for (const j of journals) {
    if (norm(j.title).includes(q) || norm(j.preview).includes(q)) {
      hits.push({ id: j.id, kind: 'journal', title: j.title, subtitle: j.date, route: `/(tabs)/more/journal/${j.id}`, icon: 'book-outline' });
    }
  }
  for (const co of courses) {
    if (norm(co.name).includes(q) || norm(co.teacher).includes(q)) {
      hits.push({ id: co.id, kind: 'course', title: co.name, subtitle: co.teacher, route: `/(tabs)/more/study/${co.id}`, icon: 'school-outline' });
    }
  }
  for (const l of library) {
    if (norm(l.title).includes(q) || norm(l.author).includes(q)) {
      hits.push({ id: l.id, kind: 'library', title: l.title, subtitle: l.author, route: `/(tabs)/more/learning`, icon: 'library-outline' });
    }
  }
  for (const m of memory) {
    hits.push({ id: m.id, kind: 'memory', title: m.label, subtitle: m.type, route: `/(tabs)/more/memory`, icon: 'git-network-outline' });
  }
  for (const e of events) {
    if (norm(e.title).includes(q)) {
      hits.push({ id: e.id, kind: 'event', title: e.title, subtitle: `${e.start} - ${e.end}`, route: '/(tabs)/more/schedule', icon: 'calendar-outline' });
    }
  }
  for (const m of meals) {
    if (norm(m.name).includes(q)) {
      hits.push({ id: m.id, kind: 'meal', title: m.name, subtitle: `${m.calories} kcal`, route: '/(tabs)/more/health', icon: 'nutrition-outline' });
    }
  }
  for (const w of workouts) {
    if (norm(w.name).includes(q)) {
      hits.push({ id: w.id, kind: 'workout', title: w.name, subtitle: `${w.durationMin}m`, route: '/(tabs)/more/exercise', icon: 'barbell-outline' });
    }
  }
  for (const i of insights) {
    if (norm(i.title).includes(q) || norm(i.body ?? '').includes(q)) {
      hits.push({ id: i.id, kind: 'insight', title: i.title, subtitle: i.domain, route: '/(tabs)/home', icon: 'sparkles-outline' });
    }
  }

  return hits;
}
