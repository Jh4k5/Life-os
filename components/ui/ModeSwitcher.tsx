// components/ui/ModeSwitcher.tsx
// A calm horizontal mode picker. Switching reshapes Home/dashboard emphasis.
import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { MODES, useModeStore } from '@/store/modeStore';

export const ModeSwitcher = () => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir } = useRTL();
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[S.wrap, { flexDirection: rowDir }]}
    >
      {MODES.map((m) => {
        const active = m.key === mode;
        return (
          <Pressable
            key={m.key}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setMode(m.key);
            }}
            style={[
              S.chip,
              {
                backgroundColor: active ? c.accent : c.bg2,
                borderColor: active ? c.accent : c.b1,
              },
            ]}
          >
            <Ionicons name={m.icon as any} size={14} color={active ? '#FFF' : c.t2} />
            <Text style={{ color: active ? '#FFF' : c.t2, fontSize: 13, fontWeight: '600' }}>{t(`modes.${m.key}_label`)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const S = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
