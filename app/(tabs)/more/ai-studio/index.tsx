// app/(tabs)/more/ai-studio/index.tsx
// A factory for intelligent workspaces — a calm gallery of living spaces,
// not a settings list. Create: with AI · from template · empty.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { workspaceMeta } from '@/services/workspaces';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { aiService, buildWorkspace } from '@/services/aiService';

export default function AIStudioScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const addWorkspace = useWorkspaceStore((s) => s.add);

  const createWithAI = async () => {
    if (!prompt.trim()) return;
    const s = await aiService.suggestWorkspace({ kind: 'text', text: prompt });
    const ws = buildWorkspace(s?.type ?? 'goal', s?.title ?? prompt.trim().slice(0, 24));
    addWorkspace(ws);
    setPrompt('');
    router.push(`/(tabs)/more/ai-studio/${ws.id}`);
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.ai_studio')} accent={c.accent} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        <Text style={[S.intro, { color: c.t1, textAlign }]}>
          صف مشكلتك — وأبني لك بيئة كاملة لحلّها.
        </Text>

        {/* Create with AI */}
        <View style={[S.prompt, { backgroundColor: c.bg2, borderColor: c.b1, flexDirection: rowDir }]}>
          <Ionicons name="sparkles-outline" size={18} color={c.accent} />
          <TextInput
            style={[S.promptInput, { color: c.t1, textAlign }]}
            placeholder="مثال: عندي امتحان بعد أسبوع، ابنِ خطة مراجعة"
            placeholderTextColor={c.t4}
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={createWithAI}
          />
          {prompt.trim().length > 0 && (
            <Pressable onPress={createWithAI} style={[S.go, { backgroundColor: c.accent }]}>
              <Ionicons name="arrow-up" size={16} color="#FFF" />
            </Pressable>
          )}
        </View>
        {/* Quick create options */}
        <View style={[S.options, { flexDirection: rowDir }]}>
          {[
            { icon: 'documents-outline' as const, label: 'من قالب' },
            { icon: 'add-outline' as const, label: 'فارغة' },
          ].map((o) => (
            <Pressable key={o.label} style={[S.option, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
              <Ionicons name={o.icon} size={18} color={c.t2} />
              <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Gallery of living workspaces */}
        <Text style={[S.label, { color: c.t3, textAlign }]}>مساحاتك</Text>
        {workspaces.map((ws) => {
          const meta = workspaceMeta(ws.type);
          return (
            <Pressable key={ws.id} onPress={() => router.push(`/(tabs)/more/ai-studio/${ws.id}`)}>
              <SmartCard>
                <View style={[S.wsTop, { flexDirection: rowDir }]}>
                  <View style={[S.wsIcon, { backgroundColor: c.bg3 }]}>
                    <Ionicons name={meta.icon as any} size={20} color={c.t1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[S.wsTitleRow, { flexDirection: rowDir }]}>
                      <Text style={{ color: c.t1, fontSize: 16, fontWeight: '700', textAlign }}>{ws.title}</Text>
                      <View style={[S.typePill, { backgroundColor: c.bg3 }]}>
                        <Text style={{ color: c.t3, fontSize: 10, fontWeight: '600' }}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 2, textAlign }}>
                      {ws.subtitle} · {ws.updatedAt}
                    </Text>
                  </View>
                </View>
                <View style={[S.wsBar, { backgroundColor: c.b1 }]}>
                  <View style={[S.wsFill, { width: `${ws.progress}%`, backgroundColor: c.accent }]} />
                </View>
                <Text style={{ color: c.t3, fontSize: 11, marginTop: 6, textAlign }}>
                  {ws.blocks.length} عناصر · {ws.progress}%
                </Text>
              </SmartCard>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  intro: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  prompt: { alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  promptInput: { flex: 1, fontSize: 14 },
  go: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: { alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  options: { gap: 10 },
  option: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  wsTop: { gap: 12, alignItems: 'center' },
  wsIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wsTitleRow: { alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  wsBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  wsFill: { height: 6, borderRadius: 3 },
});
