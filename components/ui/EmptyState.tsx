// components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './Button';

interface Props {
  /** Monochrome Ionicon (v3) — preferred over emoji. */
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  action?: { label: string; onPress: () => void; color?: string };
}

export const EmptyState = ({ icon, emoji, title, action }: Props) => {
  const { c } = useTheme();
  return (
    <View style={S.wrap}>
      {icon ? (
        <View style={[S.iconWrap, { backgroundColor: c.bg2 }]}>
          <Ionicons name={icon} size={32} color={c.t3} />
        </View>
      ) : (
        <Text style={{ fontSize: 50 }}>{emoji}</Text>
      )}
      <Text style={[S.title, { color: c.t3 }]}>{title}</Text>
      {action && (
        <Button label={action.label} onPress={action.onPress} color={action.color} style={S.btn} />
      )}
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, textAlign: 'center' },
  btn: { height: 44, paddingHorizontal: 22 },
});
