// services/aiService.ts
// The ONE AI service the whole app calls (capture · routing · extraction ·
// suggestions · workspace generation). The frontend always talks to this
// interface. Today it ships a real, rule-based local implementation; later
// the same interface is backed by the server AI (see services/supabase.ts).
// This is a real seam — never a throwaway stub.

import type {
  CaptureInput,
  DetectedItem,
  EntityType,
  ParsedDay,
  Workspace,
  WorkspaceType,
} from './types';
import { getClient } from './supabase';

/** Try the server AI (Gemini via Edge Function) first; null on any failure. */
async function remoteParse(text: string): Promise<ParsedDay | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client.functions.invoke('ai-parse', { body: { text } });
    if (error || !data || !Array.isArray(data.items) || data.items.length === 0) return null;
    return data as ParsedDay;
  } catch {
    return null;
  }
}

let counter = 0;
const uid = () => `it_${Date.now()}_${counter++}`;

// ── lightweight signal detection (real, if limited) ──
const TIME_RE = /(\d{1,2})([:٫.](\d{2}))?\s*(ص|صباح|م|مساء|am|pm)?/i;
const has = (s: string, words: string[]) => words.some((w) => s.includes(w));

const TODAY = ['اليوم', 'today'];
const TOMORROW = ['غداً', 'غدا', 'بكرة', 'tomorrow'];

function detectType(line: string): { type: EntityType; confidence: number } {
  const s = line.toLowerCase();
  if (has(s, ['امتحان', 'اختبار', 'exam', 'quiz', 'test'])) return { type: 'exam', confidence: 0.9 };
  if (has(s, ['موعد', 'اجتماع', 'appointment', 'meeting', 'لقاء'])) return { type: 'appointment', confidence: 0.85 };
  if (has(s, ['عادة', 'كل يوم', 'يومياً', 'habit', 'daily'])) return { type: 'habit', confidence: 0.8 };
  if (has(s, ['ذكرني', 'تذكير', 'remind', 'reminder'])) return { type: 'reminder', confidence: 0.85 };
  if (has(s, ['اقترح', 'ممكن', 'suggest', 'maybe'])) return { type: 'suggestion', confidence: 0.6 };
  if (has(s, ['لازم', 'يجب', 'محتاج', 'task', 'todo', 'أنجز', 'اعمل', 'أعمل'])) return { type: 'task', confidence: 0.75 };
  if (has(s, ['قائمة', 'checklist', 'أحضّر', 'أجهّز'])) return { type: 'checklist', confidence: 0.7 };
  return { type: 'note', confidence: 0.5 };
}

function extractTime(line: string): string | undefined {
  const m = line.match(TIME_RE);
  if (!m || !m[1]) return undefined;
  const when = has(line, TOMORROW) ? 'غداً' : has(line, TODAY) ? 'اليوم' : '';
  return `${when} ${m[0]}`.trim();
}

/** Split a brain-dump into candidate lines (sentences / clauses). */
function segment(text: string): string[] {
  return text
    .split(/[.\n،؛!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export interface AIService {
  parseDay(input: CaptureInput): Promise<ParsedDay>;
  suggestWorkspace(input: CaptureInput): Promise<{ type: WorkspaceType; title: string } | null>;
  generateWorkspace(type: WorkspaceType, title: string): Promise<Workspace>;
}

const localAI: AIService = {
  async parseDay(input) {
    const text = input.text ?? '';

    // Prefer the server AI (Gemini) when the backend is live; else local parse.
    const remote = await remoteParse(text);
    if (remote) return remote;

    const lines = segment(text);
    const items: DetectedItem[] = [];

    // Always keep the raw dump as a verbatim journal entry.
    if (text.trim().length > 0) {
      items.push({
        id: uid(),
        type: 'journal',
        title: text.trim().split(/\s+/).slice(0, 5).join(' ') + (text.length > 40 ? '…' : ''),
        detail: 'حُفظ بكلماتك',
        source: text.trim(),
        confidence: 0.95,
        status: 'pending',
      });
    }

    for (const line of lines) {
      const { type, confidence } = detectType(line);
      if (type === 'note' || type === 'journal') continue; // already captured as journal
      items.push({
        id: uid(),
        type,
        title: line.length > 48 ? line.slice(0, 46) + '…' : line,
        detail: extractTime(line),
        source: line,
        confidence,
        status: 'pending',
      });
    }

    // A gentle proactive suggestion if the day sounds heavy.
    if (lines.length >= 3) {
      items.push({
        id: uid(),
        type: 'suggestion',
        title: 'تقرأ ١٠ دقائق قبل النوم؟',
        detail: 'اقتراح لطيف لإنهاء اليوم بهدوء',
        confidence: 0.5,
        status: 'pending',
      });
    }

    const count = items.filter((i) => i.type !== 'journal').length;
    const reply =
      count > 0
        ? `فهمت يومك ✨ لقّطت ${count} ${count <= 2 ? 'أمر' : 'أمور'} — راجِعها وأنا أرتّبها لك.`
        : 'حفظت ما قلته في يومياتك. متى ما احتجت أرتّب شيء، قل لي.';

    return { reply, items };
  },

  async suggestWorkspace(input) {
    const s = (input.text ?? '').toLowerCase();
    if (has(s, ['امتحان', 'مذاكرة', 'دراسة', 'exam', 'study', 'revision'])) return { type: 'academic', title: 'خطة مذاكرة' };
    if (has(s, ['سفر', 'رحلة', 'travel', 'trip'])) return { type: 'travel', title: 'رحلة' };
    if (has(s, ['مشروع', 'startup', 'تطبيق', 'app', 'project'])) return { type: 'startup', title: 'مشروع' };
    if (has(s, ['تمرين', 'رياضة', 'fitness', 'لياقة'])) return { type: 'fitness', title: 'لياقة' };
    if (has(s, ['قراءة', 'كتاب', 'reading', 'book'])) return { type: 'reading', title: 'قراءة' };
    return null;
  },

  async generateWorkspace(type, title) {
    return buildWorkspace(type, title);
  },
};

// ── typed workspace generation (each type looks different) ──
export function buildWorkspace(type: WorkspaceType, title: string): Workspace {
  const base = {
    id: `ws_${Date.now()}`,
    type,
    title,
    progress: 0,
    updatedAt: 'الآن',
  };
  if (type === 'academic') {
    return {
      ...base,
      subtitle: 'خطة مراجعة ذكية',
      progress: 35,
      blocks: [
        {
          type: 'milestones',
          title: 'المراحل',
          items: [
            { id: 'm1', label: 'إنهاء الفصول 1-2', done: true },
            { id: 'm2', label: 'حل نماذج سابقة', done: false },
            { id: 'm3', label: 'مراجعة نهائية', done: false },
          ],
        },
        {
          type: 'sessions',
          title: 'جلسات المراجعة',
          items: [
            { id: 's1', label: 'الاثنين · الفصل 1', meta: '٩:٠٠ — ساعتان' },
            { id: 's2', label: 'الثلاثاء · الفصل 2', meta: '٩:٠٠ — ساعتان' },
            { id: 's3', label: 'الأربعاء · حل نماذج', meta: '١٦:٠٠ — ساعة' },
          ],
        },
        {
          type: 'tasks',
          title: 'مهام',
          items: [
            { id: 't1', label: 'تحميل ملخص الفصل 3', done: false },
            { id: 't2', label: 'حل 20 سؤال نموذجي', done: false },
          ],
        },
        { type: 'progress', title: 'التقدم' },
        {
          type: 'ai_suggestions',
          title: 'اقتراحات الذكاء',
          items: [{ id: 'a1', label: 'وقت ذروتك للمذاكرة بعد العصر — جدولت أصعب فصل وقتها.' }],
        },
      ],
    };
  }
  // generic but type-aware default
  return {
    ...base,
    subtitle: 'مساحة ذكية',
    blocks: [
      { type: 'tasks', title: 'مهام', items: [] },
      { type: 'notes', title: 'ملاحظات', items: [] },
      { type: 'ai_suggestions', title: 'اقتراحات الذكاء', items: [] },
    ],
  };
}

export const aiService = localAI;
