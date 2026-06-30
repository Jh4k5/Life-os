// store/modeStore.ts
// Adaptive Modes — instead of a new section per situation, a single mode
// reshapes the emphasis of Home and the dashboard around the user's state.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mode = 'normal' | 'study' | 'travel' | 'stress' | 'sick' | 'focus';

export interface ModeMeta {
  key: Mode;
  icon: string; // Ionicons name
  label: string;
  greeting: string; // adapted whisper line on Home
  state: string; // adapted dashboard state line
  minimal?: boolean; // hide noise (high-focus)
}

export const MODES: ModeMeta[] = [
  {
    key: 'normal',
    icon: 'sunny-outline',
    label: 'عادي',
    greeting: 'يومك تحت السيطرة',
    state: 'يومك يسير بهدوء.',
  },
  {
    key: 'study',
    icon: 'school-outline',
    label: 'مذاكرة',
    greeting: 'وضع المذاكرة — ركّزت لك على الامتحان والجلسات',
    state: 'وضع المذاكرة — أبرزت الامتحان وجلسات المراجعة أولاً.',
  },
  {
    key: 'travel',
    icon: 'airplane-outline',
    label: 'سفر',
    greeting: 'وضع السفر — قائمة التحضير والمواعيد في المقدّمة',
    state: 'وضع السفر — التحضير والمواعيد في المقدّمة.',
  },
  {
    key: 'stress',
    icon: 'leaf-outline',
    label: 'هدوء',
    greeting: 'وضع الهدوء — خفّفت يومك لأهم ٣ أشياء فقط',
    state: 'وضع الهدوء — أهم ٣ أشياء فقط، الباقي ينتظر.',
  },
  {
    key: 'sick',
    icon: 'bandage-outline',
    label: 'راحة',
    greeting: 'وضع الراحة — لا ضغط اليوم، فقط الأساسيات',
    state: 'وضع الراحة — لا ضغط، فقط الأساسيات.',
  },
  {
    key: 'focus',
    icon: 'flash-outline',
    label: 'تركيز عميق',
    greeting: 'وضع التركيز العميق — أخفيت كل ما يشتّت',
    state: 'وضع التركيز العميق — شاشة هادئة بلا تشتيت.',
    minimal: true,
  },
];

interface ModeState {
  mode: Mode;
  setMode: (m: Mode) => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'normal',
      setMode: (m) => set({ mode: m }),
    }),
    { name: 'liveos-mode', storage: createJSONStorage(() => AsyncStorage) }
  )
);

export const modeMeta = (m: Mode) => MODES.find((x) => x.key === m) ?? MODES[0];
