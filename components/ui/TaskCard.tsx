// components/ui/TaskCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { TaskData } from '@/data/mock';

const PRIORITY_DOT: Record<TaskData['priority'], string> = {
  none: 't3',
  low: 'green',
  medium: 'blue',
  high: 'yellow',
  urgent: 'red',
};

const ENERGY_ICON: Record<TaskData['energy'], string> = {
  low: '🌙',
  medium: '☁',
  high: '⚡',
};

interface Props {
  task: TaskData;
  onToggle: (id: string) => void;
  onPress?: (id: string) => void;
}

export const TaskCard = ({ task, onToggle, onPress }: Props) => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const dotColor = c[PRIORITY_DOT[task.priority] as keyof typeof c] as string;
  const accent = task.color || c.tasks; // personal per-task color (falls back to section)
  const subCount = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <Pressable
      onPress={() => onPress?.(task.id)}
      style={[S.card, { backgroundColor: task.done ? c.bg0 : c.bg1, borderColor: c.b1 }]}
    >
      <Pressable onPress={() => onToggle(task.id)} hitSlop={8}>
        <View
          style={[
            S.check,
            {
              backgroundColor: task.done ? accent : 'transparent',
              borderColor: task.done ? accent : c.b2,
            },
          ]}
        >
          {task.done && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </Pressable>

      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color: task.done ? c.t3 : c.t1,
            fontSize: 15,
            fontWeight: '600',
            textDecorationLine: task.done ? 'line-through' : 'none',
          }}
          numberOfLines={2}
        >
          {task.icon ? `${task.icon} ` : ''}{task.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 12, color: c.t3 }}>{ENERGY_ICON[task.energy]}</Text>
          {task.due && (
            <Text style={{ fontSize: 12, color: task.priority === 'urgent' ? c.red : c.t3 }}>
              📅 {task.due}
            </Text>
          )}
          {task.area && <Text style={{ fontSize: 12, color: c.t3 }}>🗺 {task.area}</Text>}
          {subCount > 0 && (
            <Text style={{ fontSize: 12, color: c.t3 }}>
              ☑ {subDone}/{subCount}
            </Text>
          )}
        </View>
      </View>

      <View style={[S.dot, { backgroundColor: dotColor }]} />
    </Pressable>
  );
};

const S = StyleSheet.create({
  card: {
    flexDirection: 'row',
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
  dot: { width: 8, height: 8, borderRadius: 4 },
});
