// app/(tabs)/home/index.tsx
// The hero. Opening this should feel like an intelligence is present —
// never a dead empty chat. Ambient mic, time-aware greeting, a quiet
// "today at a glance" whisper, and the polished "I understood your day"
// result state powered by the real AI service + reusable Review Layer.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { MicButton } from '@/components/ui/MicButton';
import { ReviewLayer } from '@/components/ai/ReviewLayer';
import { aiService, buildWorkspace } from '@/services/aiService';
import { repository } from '@/services/repository';
import { captureService } from '@/services/captureService';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ParsedDay, DetectedItem, ReviewAction, WorkspaceType } from '@/services/types';
import { useMockStore } from '@/store/mockStore';
import { mockTasks } from '@/data/mock';
import { DayTimeline } from '@/components/ui/DayTimeline';
import { ModeSwitcher } from '@/components/ui/ModeSwitcher';
import { useModeStore, modeMeta } from '@/store/modeStore';
import { useVoice } from '@/hooks/useVoice';

type HomeView = 'ai' | 'dashboard';
const USER_NAME = 'محمد';

export default function HomeScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [view, setView] = useState<HomeView>('ai');

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <HomeHeader c={c} router={router} />
      <ViewToggle
        options={[
          { key: 'ai', label: t('home.ai') },
          { key: 'dashboard', label: t('home.dashboard') },
        ]}
        active={view}
        onChange={(v) => setView(v as HomeView)}
      />
      {view === 'ai' ? <AIView c={c} t={t} /> : <DashView c={c} t={t} router={router} />}
    </View>
  );
}

const HomeHeader = ({ c, router }: any) => {
  const { top } = useSafeAreaInsets();
  const { rowDir } = useRTL();
  return (
    <View style={[S.header, { paddingTop: top + 12, flexDirection: rowDir }]}>
      <Text style={[S.logo, { color: c.t1 }]}>Life OS</Text>
      <Pressable onPress={() => router.push('/settings')} style={[S.iconBtn, { backgroundColor: c.bg2 }]}>
        <Ionicons name="settings-outline" size={20} color={c.t2} />
      </Pressable>
    </View>
  );
};

// ── AI View ──────────────────────────────────────
const AIView = ({ c, t }: any) => {
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const addWorkspace = useWorkspaceStore((s) => s.add);
  const mode = useModeStore((s) => s.mode);
  const mm = modeMeta(mode);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ParsedDay | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [applied, setApplied] = useState<{ saved: number; demo: boolean } | null>(null);
  const [proposal, setProposal] = useState<{ type: WorkspaceType; title: string } | null>(null);

  const greeting = new Date().getHours() < 12 ? 'صباح الخير' : new Date().getHours() < 18 ? 'مساء الخير' : 'مساء الخير';

  const capture = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setApplied(null);
    setInput('');
    const parsed = await aiService.parseDay({ kind: 'text', text });
    setResult(parsed);
    setItems(parsed.items);
    setProposal(await aiService.suggestWorkspace({ kind: 'text', text }));
    setApplied(null);
    setBusy(false);
  };

  // Real voice: transcript flows into capture — we never fabricate text.
  const voice = useVoice((text) => capture(text));

  // Universal Capture: attach an image/PDF → OCR → parse into typed items.
  const captureImage = async () => {
    const image = await captureService.pickImage();
    if (!image) return;
    setBusy(true);
    setApplied(null);
    const ocr = await captureService.ocr(image);
    const text = ocr.text || ocr.lines.join('\n');
    const parsed = await aiService.parseDay({ kind: 'image', text, uri: image.uri });
    setResult(parsed);
    setItems(parsed.items);
    setBusy(false);
  };

  const onAction = (id: string, action: ReviewAction) => {
    setItems((p) =>
      p
        .map((it) =>
          it.id === id
            ? { ...it, status: action === 'accept' ? 'accepted' : action === 'ignore' ? 'ignored' : it.status }
            : it
        )
        .filter((it) => !(it.id === id && action === 'delete'))
    );
  };

  const applyAll = async () => {
    const next = items.map((it) => (it.status === 'pending' ? { ...it, status: 'accepted' as const } : it));
    setItems(next);
    const res = await repository.persistAccepted(next);
    setApplied({ saved: res.saved, demo: res.demo });
  };

  const reset = () => {
    setResult(null);
    setItems([]);
    setApplied(null);
    setProposal(null);
  };

  const createWorkspace = () => {
    if (!proposal) return;
    const ws = buildWorkspace(proposal.type, proposal.title);
    addWorkspace(ws);
    setProposal(null);
    router.push(`/(tabs)/more/ai-studio/${ws.id}`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 200 }} keyboardShouldPersistTaps="handled">
        {/* Greeting — presence, never empty */}
        <Text style={[S.greetBig, { color: c.t1, textAlign }]}>
          {greeting}، {USER_NAME}
        </Text>
        {mode === 'normal' ? (
          <GlanceWhisper c={c} textAlign={textAlign} rowDir={rowDir} />
        ) : (
          <View style={[S.glance, { flexDirection: rowDir }]}>
            <Ionicons name="ellipse" size={6} color={c.accent} />
            <Text style={{ color: c.t2, fontSize: 13, textAlign, flex: 1 }}>{mm.greeting}</Text>
          </View>
        )}
        <View style={{ marginHorizontal: -20, marginTop: 6 }}>
          <ModeSwitcher />
        </View>

        {!result && !busy && (
          <View style={S.heroMic}>
            <MicButton size="large" state={voice.state} onPress={voice.toggle} />
            {voice.state === 'recording' && voice.partial ? (
              <Text style={[S.partial, { color: c.t1, textAlign }]}>{voice.partial}</Text>
            ) : (
              <Text style={[S.heroHint, { color: c.t3 }]}>سجّل يومك أو اكتبه — وأنا أرتّبه لك</Text>
            )}
          </View>
        )}

        {busy && (
          <View style={S.thinking}>
            <ActivityIndicator color={c.accent} />
            <Text style={{ color: c.t2, fontSize: 14 }}>{t('home.mic_proc')}</Text>
          </View>
        )}

        {result && !busy && (
          <View style={{ marginTop: 22, gap: 14 }}>
            <ReviewLayer items={items} reply={result.reply} onAction={onAction} onApplyAll={applyAll} />
            {proposal && (
              <Pressable
                onPress={createWorkspace}
                style={[S.proposal, { borderColor: c.accent + '55', backgroundColor: c.accentDim, flexDirection: rowDir }]}
              >
                <Ionicons name="sparkles" size={18} color={c.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '700', textAlign }}>
                    هذا الطلب يستحق مساحته الخاصة
                  </Text>
                  <Text style={{ color: c.t2, fontSize: 12, marginTop: 2, textAlign }}>
                    أنشئ مساحة «{proposal.title}» في استوديو الذكاء؟
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={c.accent} />
              </Pressable>
            )}
            {applied && (
              <View style={[S.applied, { backgroundColor: c.greenDim, flexDirection: rowDir }]}>
                <Ionicons name="checkmark-circle" size={18} color={c.green} />
                <Text style={{ color: c.green, fontSize: 13, fontWeight: '600' }}>
                  {applied.demo
                    ? `تم التطبيق محلياً (${applied.saved}) — فعّل Supabase للمزامنة`
                    : `تم الحفظ ووُزّع على أقسامك (${applied.saved})`}
                </Text>
              </View>
            )}
            <Pressable onPress={reset} style={[S.newBtn, { borderColor: c.b1, flexDirection: rowDir }]}>
              <Ionicons name="add" size={18} color={c.t2} />
              <Text style={{ color: c.t2, fontSize: 14, fontWeight: '600' }}>التقاط جديد</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input bar — universal capture: attach · text · mic */}
      <View style={[S.inputArea, { backgroundColor: c.bg0 }]}>
        <View style={[S.inputRow, { backgroundColor: c.bg2, borderColor: c.b1, flexDirection: rowDir }]}>
          <Pressable style={S.iconGhost} onPress={captureImage}>
            <Ionicons name="add-circle-outline" size={22} color={c.t3} />
          </Pressable>
          <TextInput
            style={[S.textInput, { color: c.t1, textAlign }]}
            placeholder={t('home.type_here')}
            placeholderTextColor={c.t4}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => capture(input)}
            returnKeyType="send"
          />
          {input.trim().length > 0 ? (
            <Pressable onPress={() => capture(input)} style={[S.sendBtn, { backgroundColor: c.accent }]}>
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </Pressable>
          ) : (
            <Pressable style={S.iconGhost} onPress={voice.toggle}>
              <Ionicons
                name={voice.state === 'recording' ? 'stop-circle' : 'mic-outline'}
                size={22}
                color={voice.state === 'recording' ? c.red : c.accent}
              />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const GlanceWhisper = ({ c, textAlign, rowDir }: any) => {
  const urgent = mockTasks.filter((tk) => tk.priority === 'urgent' && !tk.done).length;
  const habits = useMockStore((s) => s.habits).filter((h) => !h.done).length;
  return (
    <View style={[S.glance, { flexDirection: rowDir }]}>
      <Ionicons name="ellipse" size={6} color={c.accent} />
      <Text style={{ color: c.t2, fontSize: 13, textAlign }}>
        {`${habits} عادات متبقية · ${urgent} مهمة عاجلة · يومك تحت السيطرة`}
      </Text>
    </View>
  );
};

// ── Dashboard View — vertical timeline, not a card grid ──
const DashView = ({ c, t, router }: any) => {
  const { textAlign, rowDir } = useRTL();
  const mode = useModeStore((s) => s.mode);
  const mm = modeMeta(mode);
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Text style={[S.stateLine, { color: c.t1, textAlign }]}>{mm.state}</Text>

      <DayTimeline />

      {/* quiet conversational AI insights — hidden in high-focus (minimal) */}
      {!mm.minimal && (
      <View style={{ gap: 10, marginTop: 22 }}>
        <Text style={[S.insightLabel, { color: c.t3, textAlign }]}>من الذكاء</Text>
        {['تركيزك أفضل بعد العصر — جدولت أصعب مهمة وقتها.', 'الثلاثاء عادةً يتأخر عليك — خفّفت مهامه.'].map(
          (line, i) => (
            <View key={i} style={[S.insightRow, { flexDirection: rowDir }]}>
              <View style={[S.insightDot, { backgroundColor: c.accent }]} />
              <Text style={{ color: c.t2, fontSize: 14, lineHeight: 21, flex: 1, textAlign }}>{line}</Text>
            </View>
          )
        )}
      </View>
      )}
    </ScrollView>
  );
};

const S = StyleSheet.create({
  screen: { flex: 1 },
  header: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 6 },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  greetBig: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  glance: { alignItems: 'center', gap: 8, marginTop: 10 },
  heroMic: { alignItems: 'center', gap: 16, marginTop: 60 },
  heroHint: { fontSize: 14, marginTop: 6 },
  partial: { fontSize: 17, fontWeight: '600', lineHeight: 26, paddingHorizontal: 12 },
  thinking: { alignItems: 'center', gap: 12, marginTop: 70 },
  applied: { alignItems: 'center', gap: 8, padding: 12, borderRadius: 14 },
  proposal: { alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  newBtn: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 14, borderWidth: 1 },
  inputArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 95, paddingTop: 10 },
  inputRow: { alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6 },
  iconGhost: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, fontSize: 15, paddingHorizontal: 4 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stateLine: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 18 },
  insightLabel: { fontSize: 12, fontWeight: '700' },
  insightRow: { alignItems: 'flex-start', gap: 10 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
