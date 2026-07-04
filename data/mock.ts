// data/mock.ts
import type { HabitData } from '@/components/ui/HabitCard';

export const mockAreas = [
  {
    id: 'a1',
    name: 'تعلم اللغة الصينية',
    emoji: '🀄',
    color: '#00D084',
    description: 'رحلتي لإتقان اللغة الصينية HSK 4',
    projects: [
      {
        id: 'p1',
        name: 'امتحان HSK 3 — يوليو',
        emoji: '📝',
        color: '#F59E0B',
        due: '2026-07-10',
        status: 'active',
        progress: 45,
        goals: [
          { id: 'g1', title: 'حفظ 600 مفردة', progress: 60, due: '2026-07-05' },
          { id: 'g2', title: 'إكمال كتاب المراجعة', progress: 30 },
        ],
        tasks: [
          { id: 't1', title: 'مراجعة الفصل الأول', priority: 'urgent', energy: 'high', done: false, due: 'اليوم' },
          { id: 't2', title: 'حل 20 سؤال نموذجي', priority: 'high', energy: 'high', done: false },
          { id: 't3', title: 'مراجعة المفردات الجديدة', priority: 'medium', energy: 'medium', done: true },
        ],
        journals: [{ id: 'j3', title: 'تقدمي هذا الأسبوع', date: '2026-06-25' }],
      },
    ],
  },
  {
    id: 'a2',
    name: 'الصحة واللياقة',
    emoji: '💪',
    color: '#EF4444',
    description: 'هدفي: صحة مستدامة وطاقة يومية عالية',
    projects: [
      {
        id: 'p2',
        name: 'خطة يوليو الصحية',
        emoji: '🏋',
        color: '#EF4444',
        due: '2026-07-31',
        status: 'active',
        progress: 20,
        goals: [{ id: 'g3', title: 'خسارة 3 كيلو', progress: 33 }],
        tasks: [{ id: 't4', title: 'سجّل في النادي', priority: 'medium', energy: 'low', done: true }],
        journals: [],
      },
    ],
  },
  {
    id: 'a3',
    name: 'المشروع الشخصي',
    emoji: '🚀',
    color: '#8B5CF6',
    description: 'Life OS — نظام تشغيل الحياة الذكي',
    projects: [],
  },
];

// Seed arrays are intentionally EMPTY: the app is local-first and shows the
// user's real data (or a designed empty state) — never fabricated rows.
export const mockHabits: HabitData[] = [];

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskData {
  id: string;
  title: string;
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  energy: 'low' | 'medium' | 'high';
  due: string | null;
  area: string | null;
  project: string | null;
  done: boolean;
  subtasks: SubTask[];
}

export const mockTasks: TaskData[] = [];

export interface JournalEntry {
  id: string;
  title: string;
  preview: string;
  date: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'awful';
  words: number;
  chars: number;
  pinned: boolean;
  tags: string[];
  areaId: string | null;
  projectId: string | null;
}

export const mockJournals: JournalEntry[] = [];

export interface Exam {
  id: string;
  name: string;
  date: string;
  chaptersCount: number;
  aiPlan: string[];
  studyHours: number;
}

export interface Course {
  id: string;
  name: string;
  emoji: string;
  color: string;
  teacher: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  exams: Exam[];
  totalStudyHours: number;
}

export const mockCourses: Course[] = [];

export interface Flashcard {
  id: string;
  courseId: string | null;
  front: string;
  back: string;
  ease: number;         // SM-2
  interval: number;     // days
  reps: number;
  due: string;          // ISO date
}

export const mockFlashcards: Flashcard[] = [];

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'podcast' | 'article' | 'video' | 'course' | 'link';
  status: 'want_to_read' | 'in_progress' | 'completed' | 'dropped';
  progress: number;
  rating: number;
  notes: string;
  tags: string[];
  areaId: string | null;
}

export const mockLibrary: LibraryItem[] = [];

export interface DopamineActivity {
  id: string;
  name: string;
  type: 'healthy' | 'addictive';
  impact: number;
  emoji: string;
  xp: number;
  logged: boolean;
}

export interface DopamineChallenge {
  id: string;
  title: string;
  days: number;
  reward: number;
  icon: string;
  active: boolean;
  completed: boolean;
}

export const mockDopamine = {
  totalXP: 520,
  todayScore: 8,
  weekProgress: [5, 12, -3, 8, 15, -5, 8],
  activities: [
    { id: 'd1', name: 'قراءة كتاب', type: 'healthy', impact: 6, emoji: '📚', xp: 18, logged: false },
    { id: 'd2', name: 'تمرين رياضي', type: 'healthy', impact: 8, emoji: '💪', xp: 24, logged: false },
    { id: 'd3', name: 'تأمل', type: 'healthy', impact: 5, emoji: '🧘', xp: 15, logged: false },
    { id: 'd4', name: 'سوشيال ميديا < ساعة', type: 'addictive', impact: -5, emoji: '📱', xp: -12, logged: false },
    { id: 'd5', name: 'نيتفليكس < ساعتين', type: 'addictive', impact: -4, emoji: '📺', xp: -10, logged: false },
    { id: 'd6', name: 'وقت مع العائلة', type: 'healthy', impact: 7, emoji: '👨‍👩‍👧', xp: 20, logged: false },
  ] as DopamineActivity[],
  challenges: [
    { id: 'ch1', title: '3 أيام بدون سوشيال ميديا', days: 3, reward: 80, icon: '📵', active: false, completed: false },
    { id: 'ch2', title: 'نوم قبل 11 لأسبوع', days: 7, reward: 150, icon: '🌙', active: true, completed: false },
    { id: 'ch3', title: '30 دقيقة تمرين يومي لأسبوع', days: 7, reward: 200, icon: '💪', active: false, completed: false },
  ] as DopamineChallenge[],
};

export interface FocusSession {
  id: string;
  task: string;
  duration: number;
  energyBefore: number;
  energyAfter: number;
  date: string;
}

export const mockFocusSessions: FocusSession[] = [
  { id: 'f1', task: 'مراجعة الفصل الأول', duration: 45, energyBefore: 4, energyAfter: 3, date: 'اليوم، ٠٣:٢ م' },
  { id: 'f2', task: 'كتابة التقرير', duration: 60, energyBefore: 3, energyAfter: 2, date: 'اليوم، ٠٠:١٠ ص' },
  { id: 'f3', task: 'تصميم الواجهة', duration: 90, energyBefore: 5, energyAfter: 4, date: 'أمس، ٠٠:٤ م' },
];

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  allDay: boolean;
  source: 'event' | 'task' | 'study' | 'exam' | 'habit';
  location?: string;
}

export const mockEvents: ScheduleEvent[] = [];

// Templates للعادات (50+ template)
export const habitTemplates = {
  health: [
    { name: 'شرب الماء', emoji: '💧', color: '#3B82F6', type: 'counter', target: 8, unit: 'كوب', freq: 'daily', timePref: 'anytime' },
    { name: 'المشي', emoji: '🚶', color: '#00D084', type: 'timer', target: 30, unit: 'دقيقة', freq: 'daily', timePref: 'morning' },
    { name: 'التمرين', emoji: '💪', color: '#EF4444', type: 'timer', target: 45, unit: 'دقيقة', freq: 'daily', timePref: 'morning' },
    { name: 'النوم قبل 11', emoji: '🌙', color: '#8B5CF6', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'evening' },
    { name: 'التأمل', emoji: '🧘', color: '#A855F7', type: 'timer', target: 10, unit: 'دقيقة', freq: 'daily', timePref: 'morning' },
    { name: 'الفيتامينات', emoji: '💊', color: '#14B8A6', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'morning' },
    { name: 'الإفطار الصحي', emoji: '🥗', color: '#00D084', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'morning' },
    { name: 'شد العضلات', emoji: '🤸', color: '#F59E0B', type: 'timer', target: 10, unit: 'دقيقة', freq: 'daily', timePref: 'anytime' },
  ],
  productivity: [
    { name: 'التخطيط اليومي', emoji: '📋', color: '#3B82F6', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'morning' },
    { name: 'المراجعة الأسبوعية', emoji: '📊', color: '#8B5CF6', type: 'checkbox', target: 1, unit: '', freq: 'weekly', timePref: 'evening' },
    { name: 'بدون هاتف صباحاً', emoji: '📵', color: '#EF4444', type: 'timer', target: 60, unit: 'دقيقة', freq: 'daily', timePref: 'morning' },
    { name: 'صندوق الوارد صفر', emoji: '📧', color: '#F59E0B', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'afternoon' },
    { name: 'تعلم شيء جديد', emoji: '💡', color: '#EC4899', type: 'timer', target: 20, unit: 'دقيقة', freq: 'daily', timePref: 'anytime' },
  ],
  learning: [
    { name: 'القراءة', emoji: '📖', color: '#F59E0B', type: 'timer', target: 20, unit: 'دقيقة', freq: 'daily', timePref: 'evening' },
    { name: 'تعلم لغة', emoji: '🗣', color: '#00D084', type: 'timer', target: 15, unit: 'دقيقة', freq: 'daily', timePref: 'anytime' },
    { name: 'بودكاست تعليمي', emoji: '🎙', color: '#EC4899', type: 'timer', target: 30, unit: 'دقيقة', freq: 'daily', timePref: 'anytime' },
    { name: 'كتابة يومية', emoji: '✍', color: '#06B6D4', type: 'timer', target: 10, unit: 'دقيقة', freq: 'daily', timePref: 'evening' },
  ],
  discipline: [
    { name: 'صيام متقطع', emoji: '⏰', color: '#D97706', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'anytime' },
    { name: 'دش بارد', emoji: '🚿', color: '#3B82F6', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'morning' },
    { name: 'يوم بدون سكر', emoji: '🍬', color: '#EF4444', type: 'checkbox', target: 1, unit: '', freq: 'daily', timePref: 'anytime' },
    { name: 'المشي بدل السيارة', emoji: '🚶', color: '#00D084', type: 'checkbox', target: 1, unit: '', freq: 'custom', timePref: 'anytime' },
  ],
};

// ── Phase 2 body domains (Health / Nutrition / Exercise) — seed/fallback only ──
import type { Meal, HealthDay, Workout } from '@/services/types';

const _today = new Date().toISOString().slice(0, 10);

export const mockHealthToday: HealthDay = {
  day: _today,
  weightKg: null,
  heightCm: null,
  waterMl: 0,
  sleepMin: 0,
  steps: 0,
};

export const mockMeals: Meal[] = [];

export const mockWorkouts: Workout[] = [];
