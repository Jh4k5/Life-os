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
import type { ParsedDay, DetectedItem, EntityType, ReviewAction, WorkspaceType } from '@/services/types';
import { useMockStore } from '@/store/mockStore';
import { mockTasks, mockCourses } from '@/data/mock';
import { useAsync } from '@/hooks/useAsync';
import { DayTimeline } from '@/components/ui/DayTimeline';
import { ModeSwitcher } from '@/components/ui/ModeSwitcher';
import { useModeStore, modeMeta } from '@/store/modeStore';
import { useVoice } from '@/hooks/useVoice';
import { intelligence, type Insight, type NextAction } from '@/services/intelligence';
import { Sparkline, trendOf } from '@/components/ui/Sparkline';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { type as T } from '@/tokens/typography';
import { motion, stagger } from '@/tokens/motion';
import { useProfileStore } from '@/store/profileStore';

type HomeView = 'ai' | 'dashboard';

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

  const name = useProfileStore((s) => s.name);
  const greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

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

  // Smart follow-up: user resolves an ambiguous capture → trust it fully.
  const onReclassify = (id: string, type: EntityType) => {
    setItems((p) => p.map((it) => (it.id === id ? { ...it, type, confidence: 0.85 } : it)));
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
          {name ? `${greeting}، ${name}` : greeting}
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
            <ReviewLayer items={items} reply={result.reply} onAction={onAction} onApplyAll={applyAll} onReclassify={onReclassify} />
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
                  {`تم الحفظ ووُزّع على أقسامك (${applied.saved})`}
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

// Command-center strip — real counts, each tile taps into its section.
const CommandStats = ({ c, t, router, rowDir }: any) => {
  const { data: tasks } = useAsync(() => repository.listTasks(), mockTasks);
  const { data: courses } = useAsync(() => repository.listCourses(), mockCourses);
  const habitsLeft = useMockStore((s) => s.habits).filter((h: any) => !h.done).length;
  const tasksLeft = tasks.filter((tk) => !tk.done).length;
  const now = Date.now();
  const examsSoon = courses.reduce(
    (n, co) => n + co.exams.filter((e) => e.date && new Date(e.date).getTime() >= now).length,
    0
  );

  const tiles = [
    { icon: 'repeat-outline', val: habitsLeft, label: t('sections.habits'), route: '/(tabs)/more/habits' },
    { icon: 'checkmark-circle-outline', val: tasksLeft, label: t('sections.tasks'), route: '/(tabs)/more/tasks' },
    { icon: 'school-outline', val: examsSoon, label: t('sections.study'), route: '/(tabs)/more/study' },
  ] as const;

  return (
    <View style={[DS.row, { flexDirection: rowDir }]}>
      {tiles.map((tile) => (
        <Pressable key={tile.label} onPress={() => router.push(tile.route)} style={[DS.tile, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
          <Ionicons name={tile.icon as any} size={18} color={c.t2} />
          <Text style={{ color: c.t1, fontWeight: '800', fontSize: 22, letterSpacing: -0.4, fontVariant: ['tabular-nums'] }}>{tile.val}</Text>
          <Text style={[{ color: c.t3 }, T.caption]} numberOfLines={1}>
            {tile.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const DS = StyleSheet.create({
  row: { gap: 10, marginBottom: 22 },
  tile: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
});

// ── Dashboard View — the command center. Answers at a glance:
// what now · what needs attention · what's trending · what the AI sees.
const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  warning: 'alert-circle-outline',
  opportunity: 'sparkles-outline',
  trend: 'trending-up-outline',
  correlation: 'git-compare-outline',
};
const MOOD_VAL: Record<string, number> = { great: 2, good: 1, neutral: 0, bad: -1, awful: -2 };

const DashView = ({ c, t, router }: any) => {
  const { textAlign, rowDir } = useRTL();
  const mode = useModeStore((s) => s.mode);
  const mm = modeMeta(mode);

  const [now, setNow] = useState<NextAction | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [attention, setAttention] = useState<{ icon: string; label: string; route: string }[]>([]);
  const [moodSeries, setMoodSeries] = useState<number[]>([]);

  const load = React.useCallback(async () => {
    await intelligence.runDailyPass();
    const [na, ins, tasks, courses, cards, journals] = await Promise.all([
      intelligence.nextAction(),
      intelligence.listInsights(),
      repository.listTasks(),
      repository.listCourses(),
      repository.listDueFlashcards(),
      repository.listJournal(),
    ]);
    setNow(na);
    setInsights(ins);

    const chips: { icon: string; label: string; route: string }[] = [];
    const urgent = tasks.filter((tk) => !tk.done && tk.priority === 'urgent').length;
    if (urgent) chips.push({ icon: 'flash-outline', label: `${urgent} ${t('dash.chip_urgent')}`, route: '/(tabs)/more/tasks' });
    const soonExams = courses.reduce(
      (n: number, co: any) =>
        n +
        co.exams.filter((e: any) => {
          if (!e.date) return false;
          const d = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86_400_000);
          return d >= 0 && d <= 7;
        }).length,
      0
    );
    if (soonExams) chips.push({ icon: 'school-outline', label: `${soonExams} ${t('dash.chip_exams')}`, route: '/(tabs)/more/study' });
    if (cards.length) chips.push({ icon: 'albums-outline', label: `${cards.length} ${t('dash.chip_cards')}`, route: '/(tabs)/more/study/flashcards' });
    setAttention(chips);

    setMoodSeries(journals.slice(0, 7).map((j) => MOOD_VAL[j.mood] ?? 0).reverse());
  }, [t]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Insight action = single-item review: the user explicitly approves the
  // exact shown item before it is written (Review Layer semantics, inline).
  const actOn = async (ins: Insight) => {
    if (ins.action) {
      await repository.persistAccepted([{ ...ins.action, status: 'accepted' }]);
    }
    await intelligence.setInsightStatus(ins.id, 'acted');
    setInsights((p) => p.filter((i) => i.id !== ins.id));
  };
  const dismiss = async (ins: Insight) => {
    await intelligence.setInsightStatus(ins.id, 'dismissed');
    setInsights((p) => p.filter((i) => i.id !== ins.id));
  };

  // life pulse — today's real state as a calm dot beside the state line
  const pulse = attention.length === 0 ? 'clear' : attention.length <= 2 ? 'normal' : 'busy';
  const pulseColor = pulse === 'clear' ? c.green : pulse === 'normal' ? c.accent : c.orange;
  const moodTrend = trendOf(moodSeries);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <View style={[S.pulseRow, { flexDirection: rowDir }]}>
        <View style={[S.pulseDot, { backgroundColor: pulseColor }]} />
        <Text style={[S.stateLine, { color: c.t1, textAlign, flex: 1, marginBottom: 0 }]}>{mm.state}</Text>
      </View>

      {/* NOW — the one thing to do, with the reason */}
      {now && (
        <Animated.View entering={FadeInDown.delay(stagger(0)).duration(motion.duration.base).springify().damping(motion.spring.damping)}>
          <Pressable
            onPress={() => router.push(now.route)}
            style={[S.nowCard, { backgroundColor: c.bg1, borderColor: c.accent + '44' }]}
          >
            <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 12 }}>
              <View style={[S.nowIcon, { backgroundColor: c.accentDim }]}>
                <Ionicons name={now.icon as any} size={20} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: c.accent, textAlign }, T.label]}>{t('dash.now')}</Text>
                <Text style={[{ color: c.t1, marginTop: 3, textAlign }, T.title]} numberOfLines={1}>
                  {now.title}
                </Text>
                <Text style={[{ color: c.t3, marginTop: 2, textAlign }, T.caption]} numberOfLines={1}>
                  {now.reason}
                </Text>
              </View>
              <Ionicons name={rowDir === 'row-reverse' ? 'chevron-back' : 'chevron-forward'} size={18} color={c.t3} />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* ATTENTION — what can't wait */}
      {attention.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(stagger(1)).duration(motion.duration.base).springify().damping(motion.spring.damping)}
          style={[S.chipRow, { flexDirection: rowDir }]}
        >
          {attention.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => router.push(a.route)}
              style={[S.attnChip, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}
            >
              <Ionicons name={a.icon as any} size={13} color={c.t2} />
              <Text style={[{ color: c.t2 }, T.caption, { fontWeight: '600' }]}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(stagger(2)).duration(motion.duration.base).springify().damping(motion.spring.damping)}>
        <CommandStats c={c} t={t} router={router} rowDir={rowDir} />
      </Animated.View>

      {/* TREND — mood over the last entries (single series; icon+text delta) */}
      {moodSeries.length >= 3 && (
        <Animated.View
          entering={FadeInDown.delay(stagger(3)).duration(motion.duration.base).springify().damping(motion.spring.damping)}
          style={[S.trendCard, { backgroundColor: c.bg1, borderColor: c.b1 }]}
        >
          <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 8 }}>
            <Text style={{ color: c.t3, fontSize: 12, fontWeight: '700', flex: 1, textAlign }}>{t('dash.mood_trend')}</Text>
            <Ionicons
              name={moodTrend === 'up' ? 'arrow-up-outline' : moodTrend === 'down' ? 'arrow-down-outline' : 'remove-outline'}
              size={13}
              color={c.t2}
            />
            <Text style={{ color: c.t2, fontSize: 12, fontWeight: '600' }}>{t(`dash.trend_${moodTrend}`)}</Text>
          </View>
          <View style={{ marginTop: 10, width: 130 }}>
            <Sparkline data={moodSeries} />
          </View>
        </Animated.View>
      )}

      <DayTimeline />

      {/* INSIGHTS — real, persisted, actionable; hidden in high-focus mode */}
      {!mm.minimal && insights.length > 0 && (
        <View style={{ gap: 10, marginTop: 22 }}>
          <Text style={[S.insightLabel, { color: c.t3, textAlign }, T.label]}>{t('dash.insights')}</Text>
          {insights.map((ins, i) => (
            <Animated.View
              key={ins.id}
              entering={FadeInDown.delay(stagger(i)).duration(motion.duration.base).springify().damping(motion.spring.damping)}
              style={[S.insightCard, { backgroundColor: c.bg1, borderColor: c.b1 }]}
            >
              <View style={{ flexDirection: rowDir, alignItems: 'flex-start', gap: 10 }}>
                <Ionicons
                  name={KIND_ICON[ins.kind] ?? 'ellipse-outline'}
                  size={16}
                  color={ins.kind === 'warning' ? c.orange : c.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', lineHeight: 20, textAlign }}>{ins.title}</Text>
                  {ins.body && (
                    <Text style={{ color: c.t3, fontSize: 12, marginTop: 3, lineHeight: 18, textAlign }}>{ins.body}</Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: rowDir, gap: 8, marginTop: 10 }}>
                {ins.action && (
                  <Pressable onPress={() => actOn(ins)} style={[S.insBtn, { flexDirection: rowDir, backgroundColor: c.accentDim }]}>
                    <Ionicons name="checkmark" size={13} color={c.accent} />
                    <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                      {ins.action.title}
                    </Text>
                  </Pressable>
                )}
                <Pressable onPress={() => dismiss(ins)} style={[S.insBtn, { backgroundColor: c.bg3 }]}>
                  <Text style={{ color: c.t3, fontSize: 12, fontWeight: '600' }}>{t('dash.dismiss')}</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))}
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
  greetBig: { ...T.display, marginTop: 6 },
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
  stateLine: { ...T.h2, marginBottom: 18 },
  pulseRow: { alignItems: 'center', gap: 10, marginBottom: 18 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  nowCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12 },
  nowIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  attnChip: { alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  trendCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  insightCard: { borderRadius: 16, borderWidth: 1, padding: 13 },
  insBtn: { alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, flexDirection: 'row' },
  insightLabel: { fontSize: 12, fontWeight: '700' },
  insightRow: { alignItems: 'flex-start', gap: 10 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
