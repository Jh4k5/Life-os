// store/mockStore.ts
// مخزن خفيف للحالة المؤقتة في الواجهة (frontend-only, mock data)
import { create } from 'zustand';
import { mockHabits } from '@/data/mock';
import type { HabitData } from '@/components/ui/HabitCard';

interface MockState {
  habits: HabitData[];
  hydrated: boolean;
  updateHabit: (id: string, val: number, done: boolean) => void;
  hydrate: (list: HabitData[]) => void;
  resetHabits: () => void;
}

export const useMockStore = create<MockState>((set) => ({
  habits: mockHabits,
  hydrated: false,
  updateHabit: (id, val, done) =>
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, todayValue: val, done } : h)),
    })),
  // Replace the working set from a real source (Supabase) once, preserving the
  // mock fallback until real data arrives.
  hydrate: (list) => set({ habits: list, hydrated: true }),
  resetHabits: () => set({ habits: mockHabits, hydrated: false }),
}));
