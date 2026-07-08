// store/sectionPrefs.ts
// Per-section customization (Health / Exercise / Wellbeing): goals, units,
// a daily reminder time, and which cards are hidden. Persisted to AsyncStorage
// so every choice survives a full app restart — mirrors store/settingsStore.ts.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Section = 'health' | 'exercise' | 'wellbeing';
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
  hiddenCards: string[]; // card keys the user hid
}

const base = (): SectionPrefs => ({
  goals: { calorieTarget: null, waterTargetMl: 2500, screenTimeTargetMin: 120 },
  units: { weight: 'kg', volume: 'ml' },
  reminderTime: '',
  hiddenCards: [],
});

interface State {
  health: SectionPrefs;
  exercise: SectionPrefs;
  wellbeing: SectionPrefs;
  setGoals: (s: Section, patch: Partial<SectionPrefs['goals']>) => void;
  setUnits: (s: Section, patch: Partial<SectionPrefs['units']>) => void;
  setReminderTime: (s: Section, time: string) => void;
  setHiddenCards: (s: Section, keys: string[]) => void;
  toggleCard: (s: Section, key: string) => void;
}

export const useSectionPrefs = create<State>()(
  persist(
    (set) => ({
      health: base(),
      exercise: base(),
      wellbeing: base(),
      setGoals: (s, patch) =>
        set((st) => ({ [s]: { ...st[s], goals: { ...st[s].goals, ...patch } } }) as Partial<State>),
      setUnits: (s, patch) =>
        set((st) => ({ [s]: { ...st[s], units: { ...st[s].units, ...patch } } }) as Partial<State>),
      setReminderTime: (s, time) => set((st) => ({ [s]: { ...st[s], reminderTime: time } }) as Partial<State>),
      setHiddenCards: (s, keys) => set((st) => ({ [s]: { ...st[s], hiddenCards: keys } }) as Partial<State>),
      toggleCard: (s, key) =>
        set((st) => {
          const hidden = st[s].hiddenCards.includes(key)
            ? st[s].hiddenCards.filter((k) => k !== key)
            : [...st[s].hiddenCards, key];
          return { [s]: { ...st[s], hiddenCards: hidden } } as Partial<State>;
        }),
    }),
    { name: 'lifeos-section-prefs', storage: createJSONStorage(() => AsyncStorage) }
  )
);

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
