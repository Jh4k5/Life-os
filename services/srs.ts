// services/srs.ts
// Spaced repetition (SM-2) — the real algorithm behind Study flashcards.
// grade: 0..5 (how well the card was recalled). Returns the next schedule.
// Reference: SuperMemo SM-2. Kept pure so it's trivially testable and reused
// on both the client (optimistic) and, later, a server job.

export interface SrsState {
  ease: number;      // ease factor (>= 1.3)
  interval: number;  // days until next review
  reps: number;      // consecutive successful reviews
}

export interface SrsResult extends SrsState {
  due: string;       // ISO date (yyyy-mm-dd)
}

export function sm2(state: SrsState, grade: number): SrsResult {
  let { ease, interval, reps } = state;
  const q = Math.max(0, Math.min(5, Math.round(grade)));

  if (q < 3) {
    // lapse — start the ladder over, see it again tomorrow
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  }
  ease = Math.max(1.3, ease);

  const d = new Date();
  d.setDate(d.getDate() + interval);
  return { ease, interval, reps, due: d.toISOString().slice(0, 10) };
}

/** The three human-facing grades we surface (mapped onto SM-2's 0..5). */
export const REVIEW_GRADES = [
  { key: 'again', grade: 1, labelKey: 'study.srs_again' },
  { key: 'good', grade: 4, labelKey: 'study.srs_good' },
  { key: 'easy', grade: 5, labelKey: 'study.srs_easy' },
] as const;

export type ReviewGradeKey = (typeof REVIEW_GRADES)[number]['key'];

/** A card is due when its due date is today or earlier. */
export function isDue(dueISO: string, now = new Date()): boolean {
  return new Date(dueISO).getTime() <= now.getTime();
}
