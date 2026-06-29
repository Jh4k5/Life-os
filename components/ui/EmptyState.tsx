// components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './Button';

interface Props {
  emoji: string;
  title: string;
  action?: { label: string; onPress: () => void; color?: string };
}

export const EmptyState = ({ emoji, title, action }: Props) => {
  const { c } = useTheme();
  return (
    <View style={S.wrap}>
      <Text style={{ fontSize: 50 }}>{emoji}</Text>
      <Text style={[S.title, { color: c.t3 }]}>{title}</Text>
      {action && (
        <Button label={action.label} onPress={action.onPress} color={action.color} style={S.btn} />
      )}
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  title: { fontSize: 16, textAlign: 'center' },
  btn: { height: 44, paddingHorizontal: 22 },
});
