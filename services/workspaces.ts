// services/workspaces.ts
// Sample living workspaces for AI Studio. The Academic one is fully realized.
// Real shape (services/types) — the same the AI service generates.
import { buildWorkspace } from './aiService';
import type { Workspace } from './types';

const academic = buildWorkspace('academic', 'امتحان الكيمياء العضوية');
academic.subtitle = 'بعد ٦ أيام · ٨ فصول';
academic.updatedAt = 'قبل ساعة';

export const mockWorkspaces: Workspace[] = [
  academic,
  {
    id: 'ws_travel',
    type: 'travel',
    title: 'رحلة إسطنبول',
    subtitle: '٥ أيام · مارس',
    progress: 20,
    updatedAt: 'أمس',
    blocks: [
      { type: 'checklist', title: 'قائمة التحضير', items: [{ id: 'c1', label: 'جواز السفر', done: true }, { id: 'c2', label: 'حجز الفندق', done: false }] },
      { type: 'calendar', title: 'خط الرحلة', items: [] },
      { type: 'notes', title: 'ملاحظات', items: [] },
    ],
  },
  {
    id: 'ws_reading',
    type: 'reading',
    title: 'قراءة هذا الشهر',
    subtitle: 'كتابان',
    progress: 55,
    updatedAt: 'قبل ٣ أيام',
    blocks: [
      { type: 'progress', title: 'التقدم' },
      { type: 'resources', title: 'الكتب', items: [{ id: 'r1', label: 'العادات الذرية', meta: '65%' }] },
    ],
  },
];

const TYPE_META: Record<string, { icon: string; label: string }> = {
  academic: { icon: 'school-outline', label: 'أكاديمي' },
  travel: { icon: 'airplane-outline', label: 'سفر' },
  startup: { icon: 'rocket-outline', label: 'مشروع' },
  fitness: { icon: 'barbell-outline', label: 'لياقة' },
  finance: { icon: 'wallet-outline', label: 'مالية' },
  reading: { icon: 'book-outline', label: 'قراءة' },
  habit: { icon: 'repeat-outline', label: 'عادة' },
  event: { icon: 'calendar-outline', label: 'حدث' },
  goal: { icon: 'flag-outline', label: 'هدف' },
};

export const workspaceMeta = (type: string) => TYPE_META[type] ?? { icon: 'cube-outline', label: 'مساحة' };
