// contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, DEFAULT_ACCENT, accentPresets } from '@/tokens/colors';

// Every hex a curated accent can legitimately be (dark + light variants).
const CURATED_ACCENTS = new Set(accentPresets.flatMap((p) => [p.dark, p.light]));

export type ThemeMode = 'dark' | 'light' | 'system';

interface Ctx {
  mode: ThemeMode;
  isDark: boolean;
  c: typeof dark;
  accent: string;
  setMode: (m: ThemeMode) => void;
  setAccent: (hex: string) => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const sys = useColorScheme();
  const [mode, setM] = useState<ThemeMode>('system');
  const [accent, setA] = useState(DEFAULT_ACCENT); // Iris violet — brand default

  const isDark = mode === 'system' ? sys === 'dark' : mode === 'dark';
  const base = isDark ? dark : light;
  const c = {
    ...base,
    accent,
    accentL: accent + 'CC',
    accentDim: accent + '28',
    accentGlow: accent + '50',
  };

  useEffect(() => {
    AsyncStorage.multiGet(['@mode', '@accent']).then(([[, m], [, a]]) => {
      if (m) setM(m as ThemeMode);
      // Migrate any legacy/off-palette accent (e.g. the old blue) back to a
      // curated jewel tone so identity stays consistent.
      if (a && CURATED_ACCENTS.has(a)) setA(a);
      else if (a) {
        setA(DEFAULT_ACCENT);
        AsyncStorage.setItem('@accent', DEFAULT_ACCENT).catch(() => {});
      }
    });
  }, []);

  const setMode = async (m: ThemeMode) => {
    setM(m);
    await AsyncStorage.setItem('@mode', m);
  };
  const setAccent = async (hex: string) => {
    setA(hex);
    await AsyncStorage.setItem('@accent', hex);
  };

  return (
    <ThemeCtx.Provider value={{ mode, isDark, c, accent, setMode, setAccent }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
};
