// components/ui/StreakBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  streak: number;
  isBest?: boolean;
}

export const StreakBadge = ({ streak, isBest }: Props) => {
  if (streak <= 0) return null;
  return (
    <View style={S.wrap}>
      <Text style={S.txt}>
        🔥 {streak} {isBest ? '🏆' : ''}
      </Text>
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  txt: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
});
