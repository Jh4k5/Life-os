// components/ui/EmptyState.tsx
// Calm empty state — Ionicon in a soft tile + message + optional action.
// (Legacy `emoji` prop still accepted for back-compat, but prefer `icon`.)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void; color?: string; icon?: string };
}

export const EmptyState = ({ icon, emoji, title, subtitle, action }: Props) => {
  const { c } = useTheme();
  return (
    <View style={S.wrap}>
      <View style={[S.tile, { backgroundColor: c.accentDim, borderColor: c.b1 }]}>
        {icon ? (
          <Ionicons name={icon} size={30} color={c.accent} />
        ) : (
          <Text style={{ fontSize: 30 }}>{emoji ?? '✦'}</Text>
        )}
      </View>
      <Text style={[S.title, { color: c.t1 }]}>{title}</Text>
      {subtitle && <Text style={[S.sub, { color: c.t3 }]}>{subtitle}</Text>}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          color={action.color}
          icon={action.icon}
          variant="soft"
          style={S.btn}
        />
      )}
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32, gap: 10 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  btn: { height: 46, paddingHorizontal: 20, marginTop: 8 },
});
