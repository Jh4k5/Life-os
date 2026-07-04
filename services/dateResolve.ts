// services/dateResolve.ts
// Turn the date words people actually type — Arabic (MSA + Gulf/Egyptian/
// Levantine) and English — into a real Date. This replaces the old "just put
// it an hour from now" placeholder so a captured "امتحان الأسبوع القادم" or
// "meeting next Monday 3pm" lands on the correct day/time on the calendar.
//
// Pure, dependency-free, and unit-testable. Returns null when no date is found
// (caller decides the fallback).

const AR_DIGITS: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
const normDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => AR_DIGITS[d] ?? d);

// Weekday name → 0..6 (Sun..Sat), covering MSA/dialect/English variants.
const WEEKDAYS: Record<string, number> = {
  'الأحد': 0, 'الاحد': 0, 'احد': 0, sunday: 0, sun: 0,
  'الإثنين': 1, 'الاثنين': 1, 'الاتنين': 1, 'اثنين': 1, monday: 1, mon: 1,
  'الثلاثاء': 2, 'الثلاثا': 2, 'ثلاثاء': 2, 'تلاتا': 2, tuesday: 2, tue: 2,
  'الأربعاء': 3, 'الاربعاء': 3, 'اربعاء': 3, 'أربعاء': 3, wednesday: 3, wed: 3,
  'الخميس': 4, 'خميس': 4, thursday: 4, thu: 4,
  'الجمعة': 5, 'جمعة': 5, friday: 5, fri: 5,
  'السبت': 6, 'سبت': 6, saturday: 6, sat: 6,
};

const atMidnight = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
const addDays = (base: Date, n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };

/** Extract a clock time (24h) from the text, honoring ص/م and am/pm. */
function extractTime(s: string): { h: number; m: number } | null {
  const m = normDigits(s).match(/(\d{1,2})\s*[:٫.]?\s*(\d{2})?\s*(ص|صباح|صباحا|م|مساء|مساءً|am|pm)?/i);
  if (!m || m[1] === undefined) return null;
  // Guard: a lone 1–2 digit number with no separator and no am/pm/ص/م marker
  // is more likely a count than a time — don't treat "20 سؤال" as 20:00.
  if (!m[2] && !m[3]) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mark = (m[3] ?? '').toLowerCase();
  const pm = mark === 'م' || mark === 'مساء' || mark === 'مساءً' || mark === 'pm';
  const am = mark === 'ص' || mark === 'صباح' || mark === 'صباحا' || mark === 'am';
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

/**
 * Resolve the first date expressed in `text`, relative to `base` (default now).
 * Returns a Date (with time applied if present) or null.
 */
export function resolveDate(text: string, base: Date = new Date()): Date | null {
  const raw = normDigits(text.toLowerCase());
  const time = extractTime(raw);
  const applyTime = (d: Date) => {
    if (time) d.setHours(time.h, time.m, 0, 0);
    else atMidnight(d);
    return d;
  };

  // 1) Explicit ISO / numeric dates: 2026-07-10, 10/7/2026, 10-7
  const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) return applyTime(d);
  }
  const dmy = raw.match(/\b(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = dmy[3] ? Number(dmy[3].length === 2 ? '20' + dmy[3] : dmy[3]) : base.getFullYear();
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime()) && day <= 31 && month <= 11) return applyTime(d);
  }

  // 2) Relative day words.
  const hit = (words: string[]) => words.some((w) => raw.includes(w));
  if (hit(['بعد بكرة', 'بعد غد', 'بعد غدا', 'day after tomorrow'])) return applyTime(addDays(base, 2));
  if (hit(['بكرة', 'غدا', 'غداً', 'tomorrow'])) return applyTime(addDays(base, 1));
  if (hit(['اليوم', 'today', 'الليلة', 'tonight'])) return applyTime(new Date(base));
  if (hit(['بعد اسبوع', 'بعد أسبوع', 'الاسبوع القادم', 'الأسبوع القادم', 'الاسبوع الجاي', 'الأسبوع الجاي', 'next week'])) return applyTime(addDays(base, 7));
  if (hit(['بعد اسبوعين', 'بعد أسبوعين', 'in two weeks'])) return applyTime(addDays(base, 14));
  if (hit(['بعد شهر', 'الشهر القادم', 'الشهر الجاي', 'next month'])) { const d = new Date(base); d.setMonth(d.getMonth() + 1); return applyTime(d); }

  // 3) "بعد N يوم/أيام/اسبوع" / "in N days/weeks".
  const inDays = raw.match(/(?:بعد|in)\s+(\d{1,3})\s*(يوم|ايام|أيام|day|days)/);
  if (inDays) return applyTime(addDays(base, parseInt(inDays[1], 10)));
  const inWeeks = raw.match(/(?:بعد|in)\s+(\d{1,2})\s*(اسبوع|أسبوع|اسابيع|أسابيع|week|weeks)/);
  if (inWeeks) return applyTime(addDays(base, parseInt(inWeeks[1], 10) * 7));

  // 4) Named weekday → next occurrence (or today if it matches and no "next").
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    if (raw.includes(name)) {
      const wantNext = hit(['القادم', 'الجاي', 'next', 'القادمة']);
      let delta = (dow - base.getDay() + 7) % 7;
      if (delta === 0 && wantNext) delta = 7;
      if (delta === 0 && !wantNext && time && (time.h * 60 + time.m) <= base.getHours() * 60 + base.getMinutes()) delta = 7;
      return applyTime(addDays(base, delta));
    }
  }

  // 5) Time only ("الساعة ٣ م") → today (or tomorrow if already past).
  if (time) {
    const d = new Date(base);
    d.setHours(time.h, time.m, 0, 0);
    if (d.getTime() <= base.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }

  return null;
}

/** Convenience: ISO string or null. */
export function resolveDateISO(text: string, base: Date = new Date()): string | null {
  const d = resolveDate(text, base);
  return d ? d.toISOString() : null;
}
