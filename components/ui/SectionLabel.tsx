// components/ui/SectionLabel.tsx
// Small uppercase section heading + optional trailing action.
// Establishes vertical rhythm between blocks on a screen.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export const SectionLabel = ({ title, action }: Props) => {
  const { c } = useTheme();
  const { rowDir, textAlign } = useRTL();
  return (
    <View style={[S.row, { flexDirection: rowDir }]}>
      <Text style={[S.title, { color: c.t3, textAlign }]}>{title.toUpperCase()}</Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={[S.action, { color: c.accent }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
};

const S = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, flex: 1 },
  action: { fontSize: 13, fontWeight: '600' },
});
