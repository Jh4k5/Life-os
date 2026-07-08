// store/sectionPrefs.ts
// Per-section customization for EVERY section of the app. Each section can set
// a display icon, an accent (constrained to the curated palettes — never used
// in global chrome), which cards/modules are visible, a default view, goals,
// units, and a daily reminder time. Persisted to AsyncStorage keyed by section
// id so every choice survives a full app restart — mirrors settingsStore.ts.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Section =
  | 'health'
  | 'exercise'
  | 'wellbeing'
  | 'habits'
  | 'tasks'
  | 'journal'
  | 'study'
  | 'learning'
  | 'areas'
  | 'focus'
  | 'schedule';

export const ALL_SECTIONS: Section[] = [
  'health', 'exercise', 'wellbeing', 'habits', 'tasks',
  'journal', 'study', 'learning', 'areas', 'focus', 'schedule',
];

export type WeightUnit = 'kg' | 'lb';
export type VolumeUnit = 'ml' | 'oz';

export interface SectionPrefs {
  goals: {
    calorieTarget: number | null; // null → use the computed TDEE target
    waterTargetMl: number;
    screenTimeTargetMin: number; // manual daily screen-time goal (wellbeing)
  };
  units: {
    weight: WeightUnit;
    volume: VolumeUnit; // energy is always kcal
  };
  reminderTime: string; // 'HH:MM' local, '' → no reminder
  hiddenCards: string[]; // card/module keys the user hid
  icon: string; // emoji, '' → the section's built-in icon
  accent: string; // curated hex, '' → the global app accent
  defaultView: string; // view key, '' → the section's built-in default
}

const base = (): SectionPrefs => ({
  goals: { calorieTarget: null, waterTargetMl: 2500, screenTimeTargetMin: 120 },
  units: { weight: 'kg', volume: 'ml' },
  reminderTime: '',
  hiddenCards: [],
  icon: '',
  accent: '',
  defaultView: '',
});

type SectionMap = Record<Section, SectionPrefs>;

const initialSections = (): SectionMap =>
  ALL_SECTIONS.reduce((acc, s) => {
    acc[s] = base();
    return acc;
  }, {} as SectionMap);

interface State {
  sections: SectionMap;
  setGoals: (s: Section, patch: Partial<SectionPrefs['goals']>) => void;
  setUnits: (s: Section, patch: Partial<SectionPrefs['units']>) => void;
  setReminderTime: (s: Section, time: string) => void;
  setHiddenCards: (s: Section, keys: string[]) => void;
  toggleCard: (s: Section, key: string) => void;
  setIcon: (s: Section, icon: string) => void;
  setAccent: (s: Section, accent: string) => void;
  setDefaultView: (s: Section, view: string) => void;
}

const patchSection = (st: State, s: Section, patch: Partial<SectionPrefs>): Partial<State> => ({
  sections: { ...st.sections, [s]: { ...st.sections[s], ...patch } },
});

export const useSectionPrefs = create<State>()(
  persist(
    (set) => ({
      sections: initialSections(),
      setGoals: (s, patch) =>
        set((st) => patchSection(st, s, { goals: { ...st.sections[s].goals, ...patch } })),
      setUnits: (s, patch) =>
        set((st) => patchSection(st, s, { units: { ...st.sections[s].units, ...patch } })),
      setReminderTime: (s, time) => set((st) => patchSection(st, s, { reminderTime: time })),
      setHiddenCards: (s, keys) => set((st) => patchSection(st, s, { hiddenCards: keys })),
      toggleCard: (s, key) =>
        set((st) => {
          const cur = st.sections[s].hiddenCards;
          const hidden = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
          return patchSection(st, s, { hiddenCards: hidden });
        }),
      setIcon: (s, icon) => set((st) => patchSection(st, s, { icon })),
      setAccent: (s, accent) => set((st) => patchSection(st, s, { accent })),
      setDefaultView: (s, view) => set((st) => patchSection(st, s, { defaultView: view })),
    }),
    {
      name: 'lifeos-section-prefs',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored health/exercise/wellbeing at the top level; lift them into
      // the generalized `sections` map so prior choices survive the upgrade.
      migrate: (persisted: any, version) => {
        if (!persisted) return { sections: initialSections() } as State;
        if (version >= 2 && persisted.sections) {
          return { ...persisted, sections: { ...initialSections(), ...persisted.sections } };
        }
        const sections = initialSections();
        for (const s of ['health', 'exercise', 'wellbeing'] as Section[]) {
          if (persisted[s]) sections[s] = { ...base(), ...persisted[s] };
        }
        return { sections } as State;
      },
      // Guarantee every known section exists after rehydrate (new sections
      // added in later versions get their defaults without a bump).
      merge: (persisted: any, current: State) => ({
        ...current,
        ...(persisted ?? {}),
        sections: { ...initialSections(), ...(persisted?.sections ?? {}) },
      }),
    }
  )
);

/** Reactive selector for one section's prefs (stable reference). */
export const useSectionPref = (s: Section) => useSectionPrefs((st) => st.sections[s]);

// Display unit conversions (storage stays metric: kg + ml).
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;
export const mlToOz = (ml: number) => ml / 29.5735;
export const ozToMl = (oz: number) => oz * 29.5735;

/** Next Date at local HH:MM (today if still ahead, else tomorrow). null if bad. */
export function nextAtTime(hhmm: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}
