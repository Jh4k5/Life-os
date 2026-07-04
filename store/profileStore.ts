// store/profileStore.ts
// The user's own identity, persisted on-device (local-first). The name here is
// what the app greets you by — never a hardcoded placeholder. When a Supabase
// account is linked, the sync layer keeps `email`/`name` in step with the
// `profiles` row, but the app is fully usable (and personal) with no account.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface P {
  name: string;
  email: string | null;
  onboarded: boolean;
  setName: (v: string) => void;
  setEmail: (v: string | null) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
}

export const useProfileStore = create<P>()(
  persist(
    (set) => ({
      name: '',
      email: null,
      onboarded: false,
      setName: (v) => set({ name: v }),
      setEmail: (v) => set({ email: v }),
      setOnboarded: (v) => set({ onboarded: v }),
      reset: () => set({ name: '', email: null, onboarded: false }),
    }),
    { name: 'liveos-profile', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
