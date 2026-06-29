// store/mockStore.ts
// مخزن خفيف للحالة المؤقتة في الواجهة (frontend-only, mock data)
import { create } from 'zustand';
import { mockHabits } from '@/data/mock';
import type { HabitData } from '@/components/ui/HabitCard';

interface MockState {
  habits: HabitData[];
  updateHabit: (id: string, val: number, done: boolean) => void;
  resetHabits: () => void;
}

export const useMockStore = create<MockState>((set) => ({
  habits: mockHabits,
  updateHabit: (id, val, done) =>
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, todayValue: val, done } : h)),
    })),
  resetHabits: () => set({ habits: mockHabits }),
}));
