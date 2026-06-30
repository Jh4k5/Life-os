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
