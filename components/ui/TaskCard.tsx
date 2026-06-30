// components/ui/TaskCard.tsx
// Task row — design-system aligned. Ionicons only (no emoji), RTL-safe,
// single-accent checkbox, priority dot, quiet meta line.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import type { TaskData } from '@/data/mock';

const PRIORITY_DOT: Record<TaskData['priority'], keyof ReturnType<typeof useTheme>['c']> = {
  none: 't3',
  low: 'green',
  medium: 'blue',
  high: 'yellow',
  urgent: 'red',
};

const ENERGY_ICON: Record<TaskData['energy'], keyof typeof Ionicons.glyphMap> = {
  low: 'moon-outline',
  medium: 'partly-sunny-outline',
  high: 'flash-outline',
};

interface Props {
  task: TaskData;
  onToggle: (id: string) => void;
  onPress?: (id: string) => void;
}

export const TaskCard = ({ task, onToggle, onPress }: Props) => {
  const { c } = useTheme();
  const { rowDir, textAlign } = useRTL();
  const dotColor = c[PRIORITY_DOT[task.priority]] as string;
  const subCount = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <Pressable
      onPress={() => onPress?.(task.id)}
      style={({ pressed }) => [
        S.card,
        {
          backgroundColor: task.done ? c.bg0 : c.bg1,
          borderColor: c.b1,
          flexDirection: rowDir,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Pressable onPress={() => onToggle(task.id)} hitSlop={10}>
        <View
          style={[
            S.check,
            {
              backgroundColor: task.done ? c.accent : 'transparent',
              borderColor: task.done ? c.accent : c.b2,
            },
          ]}
        >
          {task.done && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </Pressable>

      <View style={{ flex: 1, gap: 5 }}>
        <Text
          style={{
            color: task.done ? c.t3 : c.t1,
            fontSize: 15,
            fontWeight: '600',
            textAlign,
            textDecorationLine: task.done ? 'line-through' : 'none',
          }}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={[S.meta, { flexDirection: rowDir }]}>
          <Ionicons name={ENERGY_ICON[task.energy]} size={13} color={c.t3} />
          {task.due && (
            <View style={[S.metaItem, { flexDirection: rowDir }]}>
              <Ionicons name="calendar-outline" size={12} color={task.priority === 'urgent' ? c.red : c.t3} />
              <Text style={{ fontSize: 12, color: task.priority === 'urgent' ? c.red : c.t3 }}>{task.due}</Text>
            </View>
          )}
          {task.area && (
            <View style={[S.metaItem, { flexDirection: rowDir }]}>
              <Ionicons name="map-outline" size={12} color={c.t3} />
              <Text style={{ fontSize: 12, color: c.t3 }}>{task.area}</Text>
            </View>
          )}
          {subCount > 0 && (
            <View style={[S.metaItem, { flexDirection: rowDir }]}>
              <Ionicons name="checkbox-outline" size={12} color={c.t3} />
              <Text style={{ fontSize: 12, color: c.t3, fontVariant: ['tabular-nums'] }}>
                {subDone}/{subCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[S.dot, { backgroundColor: dotColor }]} />
    </Pressable>
  );
};

const S = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaItem: { alignItems: 'center', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
