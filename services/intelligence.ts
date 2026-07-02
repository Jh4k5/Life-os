// services/intelligence.ts
// The Life Intelligence Engine — the organ that READS the user's life and
// reasons over it. Everything else writes data; this connects it: tasks ↔
// journal ↔ study ↔ habits ↔ health ↔ calendar. Same seam pattern as
// aiService: local rule-based correlators always work (signed-out too);
// the `insights` Edge Function (Gemini over compact aggregates — never raw
// private text) enriches when live. Insights persist and are actionable:
// every suggested action is a DetectedItem that flows through the Review
// Layer before any write.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClient } from './supabase';
import { repository } from './repository';
import type { DetectedItem } from './types';
import { mockHabits } from '@/data/mock';

export type InsightKind = 'correlation' | 'warning' | 'opportunity' | 'trend';
export type InsightStatus = 'new' | 'seen' | 'acted' | 'dismissed';

export interface Insight {
  id: string;
  kind: InsightKind;
  domain: 'tasks' | 'study' | 'habits' | 'health' | 'journal' | 'calendar' | 'general';
  title: string;
  body?: string;
  evidence: Record<string, unknown>;
  confidence: number;
  status: InsightStatus;
  /** Suggested next step — must pass the Review Layer before any write. */
  action?: DetectedItem;
  createdAt: string;
}

export interface NextAction {
  title: string;
  reason: string;
  route: string;
  icon: string; // Ionicon name
}

export interface JournalSignals {
  moodScore: number; // -2..2
  stress: number; // 0..3
  energy: number; // -2..2
  topics: string[];
  people: string[];
}

// ── honest local store when signed out ──
let localInsights: Insight[] = [];
let counter = 0;
const iid = () => `ins_${Date.now()}_${counter++}`;

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

function suggest(type: DetectedItem['type'], title: string): DetectedItem {
  return { id: iid(), type, title, confidence: 0.85, status: 'pending' };
}

/** The rule-based correlators — real reasoning over real repository reads. */
async function computeLocalInsights(): Promise<Omit<Insight, 'id' | 'status' | 'createdAt'>[]> {
  const out: Omit<Insight, 'id' | 'status' | 'createdAt'>[] = [];

  const [tasks, courses, dueCards, journals, health] = await Promise.all([
    repository.listTasks(),
    repository.listCourses(),
    repository.listDueFlashcards(),
    repository.listJournal(),
    repository.getHealthToday(),
  ]);

  // 1) Exams vs revision pace → warning + planned session suggestion.
  for (const co of courses) {
    for (const exam of co.exams) {
      if (!exam.date) continue;
      const d = daysUntil(exam.date);
      if (d >= 0 && d <= 10) {
        const behind = exam.aiPlan.length === 0;
        out.push({
          kind: behind ? 'warning' : 'trend',
          domain: 'study',
          title: behind
            ? `«${exam.name}» بعد ${d} يوم بلا خطة مراجعة`
            : `«${exam.name}» بعد ${d} يوم — الخطة جارية`,
          body: behind ? `${exam.chaptersCount} فصول تحتاج توزيعًا على الأيام المتبقية.` : undefined,
          evidence: { examId: exam.id, daysLeft: d, chapters: exam.chaptersCount, hasPlan: !behind },
          confidence: 0.9,
          action: behind ? suggest('study_session', `جلسة مراجعة: ${co.name}`) : undefined,
        });
      }
    }
  }

  // 2) Due flashcards → opportunity.
  if (dueCards.length > 0) {
    out.push({
      kind: 'opportunity',
      domain: 'study',
      title: `${dueCards.length} بطاقة مستحقة للمراجعة`,
      body: 'عشر دقائق الآن تثبّت الحفظ قبل أن يتبخّر.',
      evidence: { due: dueCards.length },
      confidence: 0.8,
    });
  }

  // 3) Overdue / heavy task load → warning.
  const openTasks = tasks.filter((t) => !t.done);
  const urgent = openTasks.filter((t) => t.priority === 'urgent');
  if (urgent.length > 0) {
    out.push({
      kind: 'warning',
      domain: 'tasks',
      title: `${urgent.length} مهمة عاجلة مفتوحة`,
      evidence: { urgent: urgent.length, open: openTasks.length, first: urgent[0]?.title },
      confidence: 0.85,
    });
  }

  // 4) Habit streaks at risk (high streak, not done today).
  const habits = mockHabits; // seed shape; real habit_logs analytics lands in a later phase
  const atRisk = habits.filter((h) => !h.done && h.streak >= 5);
  if (atRisk.length > 0) {
    out.push({
      kind: 'warning',
      domain: 'habits',
      title: `سلسلة «${atRisk[0].name}» (${atRisk[0].streak} يوم) في خطر اليوم`,
      evidence: { habit: atRisk[0].name, streak: atRisk[0].streak, count: atRisk.length },
      confidence: 0.75,
    });
  }

  // 5) Journal mood trend over the last entries.
  const moodVal: Record<string, number> = { great: 2, good: 1, neutral: 0, bad: -1, awful: -2 };
  const recent = journals.slice(0, 5).map((j) => moodVal[j.mood] ?? 0);
  if (recent.length >= 3) {
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (avg <= -0.5) {
      out.push({
        kind: 'trend',
        domain: 'journal',
        title: 'مزاجك في آخر اليوميات يميل للهبوط',
        body: 'قد يفيد تخفيف يوم الغد أو جلسة مشي قصيرة.',
        evidence: { avgMood: +avg.toFixed(2), samples: recent.length },
        confidence: 0.7,
        action: suggest('habit', 'مشي ١٥ دقيقة'),
      });
    } else if (avg >= 1) {
      out.push({
        kind: 'trend',
        domain: 'journal',
        title: 'أسبوعك النفسي صاعد — استثمره',
        evidence: { avgMood: +avg.toFixed(2), samples: recent.length },
        confidence: 0.7,
      });
    }
  }

  // 6) Health today: low water / short sleep → gentle nudge (non-prescriptive).
  if (health.sleepMin > 0 && health.sleepMin < 360) {
    out.push({
      kind: 'correlation',
      domain: 'health',
      title: `نومك ${Math.round(health.sleepMin / 60)} ساعات — ركّز مهامك الخفيفة اليوم`,
      evidence: { sleepMin: health.sleepMin },
      confidence: 0.65,
    });
  }
  if (health.waterMl > 0 && health.waterMl < 1000) {
    out.push({
      kind: 'opportunity',
      domain: 'health',
      title: 'شرب الماء متأخر عن إيقاع يومك',
      evidence: { waterMl: health.waterMl },
      confidence: 0.6,
    });
  }

  return out;
}

/** Optional server enrichment — compact aggregates only, never raw text. */
async function remoteInsights(aggregates: Record<string, unknown>): Promise<Omit<Insight, 'id' | 'status' | 'createdAt'>[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client.functions.invoke('insights', { body: aggregates });
    if (error || !Array.isArray(data)) return [];
    return data
      .filter((r: any) => r && typeof r.title === 'string')
      .slice(0, 3)
      .map((r: any) => ({
        kind: (['correlation', 'warning', 'opportunity', 'trend'].includes(r.kind) ? r.kind : 'trend') as InsightKind,
        domain: 'general' as const,
        title: String(r.title).slice(0, 120),
        body: r.body ? String(r.body).slice(0, 200) : undefined,
        evidence: r.evidence ?? {},
        confidence: typeof r.confidence === 'number' ? r.confidence : 0.6,
      }));
  } catch {
    return [];
  }
}

async function activeUid(): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export const intelligence = {
  /**
   * The daily pass: compute + persist insights. Throttled to once per day
   * (AsyncStorage stamp) unless `force`. Never throws; never blocks the UI.
   */
  async runDailyPass(force = false): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = await AsyncStorage.getItem('intel:lastRun').catch(() => null);
      if (!force && last === today) return;

      const computed = await computeLocalInsights();
      const remote = await remoteInsights({
        counts: computed.map((i) => ({ d: i.domain, k: i.kind })),
        day: today,
      });
      const fresh = [...computed, ...remote];

      const uid = await activeUid();
      if (!uid) {
        // honest local mode: replace non-acted auto insights
        const kept = localInsights.filter((i) => i.status === 'acted' || i.status === 'dismissed');
        localInsights = [
          ...kept,
          ...fresh.map((f) => ({ ...f, id: iid(), status: 'new' as const, createdAt: new Date().toISOString() })),
        ];
      } else {
        const client = getClient()!;
        // dedupe on same-title new/seen insights
        const { data: existing } = await client
          .from('insights')
          .select('title')
          .in('status', ['new', 'seen']);
        const seen = new Set((existing ?? []).map((r: any) => r.title));
        const rows = fresh
          .filter((f) => !seen.has(f.title))
          .map((f) => ({
            user_id: uid,
            kind: f.kind,
            domain: f.domain,
            title: f.title,
            body: f.body ?? null,
            evidence: f.evidence,
            confidence: f.confidence,
            status: 'new',
            action: f.action ?? null,
          }));
        if (rows.length) await client.from('insights').insert(rows);
      }
      await AsyncStorage.setItem('intel:lastRun', today).catch(() => {});
    } catch {
      // the brain must never crash the app
    }
  },

  /** Current active insights, newest first. */
  async listInsights(): Promise<Insight[]> {
    const uid = await activeUid();
    if (!uid) return localInsights.filter((i) => i.status === 'new' || i.status === 'seen');
    const client = getClient()!;
    const { data, error } = await client
      .from('insights')
      .select('*')
      .in('status', ['new', 'seen'])
      .order('created_at', { ascending: false })
      .limit(6);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      kind: r.kind,
      domain: r.domain,
      title: r.title,
      body: r.body ?? undefined,
      evidence: r.evidence ?? {},
      confidence: Number(r.confidence ?? 0.6),
      status: r.status,
      action: r.action ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async setInsightStatus(id: string, status: InsightStatus): Promise<void> {
    const uid = await activeUid();
    if (!uid) {
      localInsights = localInsights.map((i) => (i.id === id ? { ...i, status } : i));
      return;
    }
    await getClient()!.from('insights').update({ status }).eq('id', id);
  },

  /** The Dashboard "Now" pick: one action + the reason, priority-ordered. */
  async nextAction(): Promise<NextAction | null> {
    const [tasks, courses, dueCards] = await Promise.all([
      repository.listTasks(),
      repository.listCourses(),
      repository.listDueFlashcards(),
    ]);

    // 1) imminent exam
    for (const co of courses) {
      for (const exam of co.exams) {
        if (!exam.date) continue;
        const d = daysUntil(exam.date);
        if (d >= 0 && d <= 3) {
          return {
            title: `راجع ${co.name}`,
            reason: `«${exam.name}» بعد ${d === 0 ? 'اليوم' : `${d} يوم`}`,
            route: `/(tabs)/more/study/${co.id}`,
            icon: 'school-outline',
          };
        }
      }
    }
    // 2) urgent open task
    const urgent = tasks.find((t) => !t.done && t.priority === 'urgent');
    if (urgent) {
      return {
        title: urgent.title,
        reason: 'أعلى أولوية مفتوحة الآن',
        route: `/(tabs)/more/tasks/${urgent.id}`,
        icon: 'flash-outline',
      };
    }
    // 3) due flashcards
    if (dueCards.length >= 3) {
      return {
        title: `راجع ${dueCards.length} بطاقة`,
        reason: 'مستحقة اليوم — عشر دقائق تكفي',
        route: '/(tabs)/more/study/flashcards',
        icon: 'albums-outline',
      };
    }
    // 4) top open task
    const top = tasks.find((t) => !t.done);
    if (top) {
      return {
        title: top.title,
        reason: 'التالي في قائمتك',
        route: `/(tabs)/more/tasks/${top.id}`,
        icon: 'checkmark-circle-outline',
      };
    }
    return null;
  },

  /**
   * Journal intelligence: extract structured signals from an entry's text
   * (Arabic dialects + English keyword scoring) — data, not judgement.
   */
  extractJournalSignals(text: string): JournalSignals {
    const s = text.toLowerCase();
    const hit = (words: string[]) => words.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);

    const posMood = hit(['سعيد', 'فرحان', 'ممتاز', 'رائع', 'مبسوط', 'حماس', 'happy', 'great', 'excited', 'proud']);
    const negMood = hit(['حزين', 'تعبان', 'زعلان', 'سيئ', 'محبط', 'ضايق', 'sad', 'tired', 'down', 'frustrated']);
    const stress = hit(['قلق', 'توتر', 'ضغط', 'خايف', 'مضغوط', 'stress', 'anxious', 'worried', 'overwhelmed', 'deadline']);
    const posEnergy = hit(['نشيط', 'طاقة', 'منتج', 'energetic', 'productive', 'focused']);
    const negEnergy = hit(['مرهق', 'خامل', 'كسول', 'ما نمت', 'سهرت', 'exhausted', 'drained', 'sleepy']);

    const TOPIC_MAP: Record<string, string[]> = {
      study: ['امتحان', 'مذاكرة', 'دراسة', 'exam', 'study'],
      work: ['شغل', 'عمل', 'اجتماع', 'work', 'meeting'],
      health: ['رياضة', 'تمرين', 'أكل', 'نوم', 'gym', 'sleep', 'food'],
      family: ['أهل', 'عائلة', 'أمي', 'أبوي', 'family', 'mom', 'dad'],
      money: ['فلوس', 'مصاريف', 'راتب', 'money', 'salary'],
    };
    const topics = Object.keys(TOPIC_MAP).filter((k) => hit(TOPIC_MAP[k]) > 0);

    // people: capitalized latin words + Arabic names after "مع"
    const people: string[] = [];
    const latin = text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
    people.push(...latin.slice(0, 3));
    const arab = text.match(/مع\s+([؀-ۿ]{2,12})/g) ?? [];
    people.push(...arab.map((m) => m.replace(/^مع\s+/, '')).slice(0, 3));

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    return {
      moodScore: clamp(posMood - negMood, -2, 2),
      stress: clamp(stress, 0, 3),
      energy: clamp(posEnergy - negEnergy, -2, 2),
      topics,
      people: [...new Set(people)],
    };
  },

  /** Persist a journal entry's signals (silent no-op signed out / on error). */
  async recordJournalSignals(entryId: string | null, text: string): Promise<JournalSignals> {
    const sig = this.extractJournalSignals(text);
    try {
      const uid = await activeUid();
      if (uid) {
        await getClient()!.from('journal_signals').insert({
          user_id: uid,
          entry_id: entryId,
          mood_score: sig.moodScore,
          stress: sig.stress,
          energy: sig.energy,
          topics: sig.topics,
          people: sig.people,
          signals: {},
        });
      }
    } catch {
      /* signals must never break saving a journal */
    }
    return sig;
  },
};
