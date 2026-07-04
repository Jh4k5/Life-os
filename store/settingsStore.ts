// store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface S {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  density: 'compact' | 'default' | 'spacious';
  aiLanguage: string;
  habitsView: 'today' | 'all';
  tasksSort: 'priority' | 'due' | 'energy';
  retroTasks: boolean;
  haptics: boolean;
  sounds: boolean;
  setFontSize: (v: S['fontSize']) => void;
  setDensity: (v: S['density']) => void;
  setAiLanguage: (v: string) => void;
  setHabitsView: (v: S['habitsView']) => void;
  setTasksSort: (v: S['tasksSort']) => void;
  setRetroTasks: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setSounds: (v: boolean) => void;
}

export const useSettingsStore = create<S>()(
  persist(
    (set) => ({
      fontSize: 'md',
      density: 'default',
      aiLanguage: 'ar',
      habitsView: 'today',
      tasksSort: 'priority',
      retroTasks: true,
      haptics: true,
      sounds: true,
      setFontSize: (v) => set({ fontSize: v }),
      setDensity: (v) => set({ density: v }),
      setAiLanguage: (v) => set({ aiLanguage: v }),
      setHabitsView: (v) => set({ habitsView: v }),
      setTasksSort: (v) => set({ tasksSort: v }),
      setRetroTasks: (v) => set({ retroTasks: v }),
      setHaptics: (v) => set({ haptics: v }),
      setSounds: (v) => set({ sounds: v }),
    }),
    { name: 'liveos-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
