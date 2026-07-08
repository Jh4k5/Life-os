// services/types.ts
// Shared types for the AI service layer. Every AI surface in the app
// (Home capture, Review Inbox, AI Studio) speaks these types.

export type EntityType =
  | 'journal'
  | 'appointment'
  | 'task'
  | 'checklist'
  | 'exam'
  | 'habit'
  | 'reminder'
  | 'note'
  | 'suggestion'
  // Phase 2 domains the capture pipeline can now feed directly.
  | 'meal'
  | 'workout'
  | 'study_session';

export type ReviewAction = 'accept' | 'edit' | 'merge' | 'ignore' | 'delete';

export interface DetectedItem {
  id: string;
  type: EntityType;
  /**
   * The operation to perform on Apply. 'create' (default) inserts a new entity;
   * 'update' patches an existing one matched by title; 'delete' removes it
   * (always behind an explicit confirmation in the Review layer).
   */
  op?: 'create' | 'update' | 'delete';
  /** Short, human title in the user's own language/dialect. */
  title: string;
  /** Optional secondary line (time, date, detail). */
  detail?: string;
  /** Verbatim source text this item was extracted from. */
  source?: string;
  /** Confidence 0..1 — low confidence items route to the Review Inbox. */
  confidence: number;
  /** Pending review state. */
  status: 'pending' | 'accepted' | 'ignored';
  /** Deep-link into the section holding this item, set once it's been added. */
  route?: string;
}

export interface ParsedDay {
  /** A warm, human one-liner the assistant says back. */
  reply: string;
  items: DetectedItem[];
}

export type CaptureKind = 'voice' | 'text' | 'image' | 'pdf' | 'screenshot';

export interface CaptureInput {
  kind: CaptureKind;
  text?: string;
  /** uri for image/pdf/audio when not text. */
  uri?: string;
}

// Workspaces (AI Studio)
export type WorkspaceType =
  | 'academic'
  | 'travel'
  | 'startup'
  | 'fitness'
  | 'finance'
  | 'reading'
  | 'habit'
  | 'event'
  | 'goal';

export type BlockType =
  | 'timeline'
  | 'calendar'
  | 'tasks'
  | 'checklist'
  | 'notes'
  | 'ai_suggestions'
  | 'files'
  | 'images'
  | 'pdfs'
  | 'links'
  | 'milestones'
  | 'progress'
  | 'sessions'
  | 'resources'
  | 'statistics'
  | 'reminders';

export interface WorkspaceBlock {
  type: BlockType;
  title: string;
  items?: { id: string; label: string; done?: boolean; meta?: string }[];
}

export interface Workspace {
  id: string;
  type: WorkspaceType;
  title: string;
  subtitle?: string;
  progress: number; // 0..100
  updatedAt: string;
  blocks: WorkspaceBlock[];
}

// ── Phase 2 domain types (Health / Nutrition / Exercise) ──
export interface MealEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  aiEstimated: boolean;
}

export interface Meal extends MealEstimate {
  id: string;
  eatenAt: string; // ISO
}

export interface HealthDay {
  day: string; // yyyy-mm-dd
  weightKg: number | null;
  heightCm: number | null;
  waterMl: number;
  sleepMin: number;
  steps: number;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}

export interface Workout {
  id: string;
  name: string;
  mode: 'gym' | 'home';
  durationMin: number;
  exercises: WorkoutExercise[];
  doneAt: string; // ISO
}

// A self-defined digital-wellbeing rule (e.g. "no phone after 22:00"). Manual,
// user-set — there is no OS Screen-Time API here.
export interface WellbeingRule {
  id: string;
  text: string;
  time: string | null; // 'HH:MM' local, optional
  enabled: boolean;
}
