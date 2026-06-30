// app/(tabs)/more/ai-studio/[id].tsx
// A typed Workspace rendered from modular blocks. Workspaces evolve — the
// AI proactively suggests growing the space as it fills up.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockWorkspaces, workspaceMeta } from '@/services/workspaces';
import type { WorkspaceBlock } from '@/services/types';

const BLOCK_ICON: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  timeline: 'git-commit-outline',
  calendar: 'calendar-outline',
  tasks: 'checkmark-circle-outline',
  checklist: 'list-outline',
  notes: 'document-text-outline',
  ai_suggestions: 'sparkles-outline',
  files: 'folder-outline',
  images: 'image-outline',
  pdfs: 'document-outline',
  links: 'link-outline',
  milestones: 'flag-outline',
  progress: 'stats-chart-outline',
  sessions: 'time-outline',
  resources: 'library-outline',
  statistics: 'analytics-outline',
  reminders: 'notifications-outline',
};

export default function WorkspaceDetailScreen() {
  const { c } = useTheme();
  const { rowDir, textAlign } = useRTL();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ws = mockWorkspaces.find((w) => w.id === id);
  const [grown, setGrown] = useState(false);

  if (!ws) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title="استوديو الذكاء" accent={c.accent} />
        <EmptyState emoji="✨" title="المساحة غير موجودة" />
      </View>
    );
  }

  const meta = workspaceMeta(ws.type);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={ws.title} subtitle={ws.subtitle} accent={c.accent} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard elevated>
          <View style={[S.hero, { flexDirection: rowDir }]}>
            <View style={[S.heroIcon, { backgroundColor: c.bg3 }]}>
              <Ionicons name={meta.icon as any} size={24} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontSize: 16, fontWeight: '700', textAlign }}>{ws.progress}% مكتمل</Text>
              <View style={[S.bar, { backgroundColor: c.b1, marginTop: 8 }]}>
                <View style={[S.fill, { width: `${ws.progress}%`, backgroundColor: c.accent }]} />
              </View>
            </View>
          </View>
        </SmartCard>

        {/* Grow suggestion (workspaces evolve) */}
        {!grown && (
          <Pressable onPress={() => setGrown(true)}>
            <SmartCard>
              <View style={[S.grow, { flexDirection: rowDir }]}>
                <Ionicons name="sparkles-outline" size={18} color={c.accent} />
                <Text style={{ flex: 1, color: c.t1, fontSize: 13, lineHeight: 21, textAlign }}>
                  هذه المساحة تكبر — أضيف قسم ملفات وخطة مراجعة متقدمة وتتبّع تقدم؟
                </Text>
                <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>أضِف</Text>
              </View>
            </SmartCard>
          </Pressable>
        )}

        {/* Modular blocks */}
        {ws.blocks.map((block, i) => (
          <Block key={i} block={block} c={c} rowDir={rowDir} textAlign={textAlign} icon={BLOCK_ICON[block.type]} />
        ))}

        {grown && (
          <Block
            block={{ type: 'files', title: 'الملفات', items: [{ id: 'f1', label: 'ملخص الفصل 3.pdf' }] }}
            c={c}
            rowDir={rowDir}
            textAlign={textAlign}
            icon={BLOCK_ICON.files}
          />
        )}
      </ScrollView>
    </View>
  );
}

const Block = ({ block, c, rowDir, textAlign, icon }: { block: WorkspaceBlock; c: any; rowDir: any; textAlign: any; icon: any }) => (
  <View style={{ gap: 8 }}>
    <View style={[S.blockHead, { flexDirection: rowDir }]}>
      <Ionicons name={icon} size={15} color={c.t3} />
      <Text style={{ color: c.t3, fontSize: 13, fontWeight: '700', textAlign }}>{block.title}</Text>
    </View>
    <SmartCard noPad>
      {block.type === 'progress' ? (
        <View style={{ padding: 16 }}>
          <View style={[S.bar, { backgroundColor: c.b1 }]}>
            <View style={[S.fill, { width: '35%', backgroundColor: c.accent }]} />
          </View>
        </View>
      ) : block.items && block.items.length > 0 ? (
        block.items.map((it, j) => (
          <View
            key={it.id}
            style={[S.itemRow, { flexDirection: rowDir }, j > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
          >
            {block.type === 'ai_suggestions' ? (
              <Ionicons name="sparkles-outline" size={16} color={c.accent} />
            ) : (
              <View
                style={[
                  S.dot,
                  { backgroundColor: it.done ? c.accent : 'transparent', borderColor: it.done ? c.accent : c.b2 },
                ]}
              >
                {it.done && <Ionicons name="checkmark" size={11} color="#FFF" />}
              </View>
            )}
            <Text
              style={{
                flex: 1,
                color: it.done ? c.t3 : c.t1,
                fontSize: 14,
                textDecorationLine: it.done ? 'line-through' : 'none',
                textAlign,
              }}
            >
              {it.label}
            </Text>
            {it.meta && <Text style={{ color: c.t3, fontSize: 12 }}>{it.meta}</Text>}
          </View>
        ))
      ) : (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: c.t4, fontSize: 13 }}>فارغ — أضِف عناصر</Text>
        </View>
      )}
    </SmartCard>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  hero: { gap: 14, alignItems: 'center' },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  grow: { gap: 12, alignItems: 'center' },
  blockHead: { alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  itemRow: { alignItems: 'center', gap: 12, padding: 14 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
