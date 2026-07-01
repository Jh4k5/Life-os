// services/search.ts
// One search across the user's whole life — tasks, journal, study, learning,
// and the memory graph. Reuses the repository reads (real DB when signed in,
// mock fallback signed out) and unifies them into routable hits.
import { repository } from './repository';

export type SearchKind = 'task' | 'journal' | 'course' | 'library' | 'memory';

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

  const [tasks, journals, courses, library, memory] = await Promise.all([
    repository.listTasks(),
    repository.listJournal(),
    repository.listCourses(),
    repository.listLibrary(),
    repository.searchMemory(query),
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

  return hits;
}
