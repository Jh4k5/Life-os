// app/(tabs)/home/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { MicButton } from '@/components/ui/MicButton';
import { SmartCard } from '@/components/ui/SmartCard';
import { HabitCard } from '@/components/ui/HabitCard';
import { useMockStore } from '@/store/mockStore';
import { mockTasks } from '@/data/mock';

type HomeView = 'ai' | 'dashboard';

const CHAT_INIT = [
  {
    id: '1',
    role: 'assistant',
    text: 'مرحباً! 🎤 حدّثني عن يومك بحرية — سجّل بصوتك أو اكتب — وسأنظّم كل شيء',
  },
];

export default function HomeScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [view, setView] = useState<HomeView>('ai');
  const habits = useMockStore((s) => s.habits);
  const updateHabit = useMockStore((s) => s.updateHabit);
  const [msgs, setMsgs] = useState(CHAT_INIT);
  const [input, setInput] = useState('');

  const sendMsg = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: input };
    const aiReply = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: 'فهمت كلامك الآن. سأستخرج المهام والعادات من ما تقول.',
    };
    setMsgs((p) => [...p, userMsg, aiReply]);
    setInput('');
  };

  const completedToday = habits.filter((h) => h.done).length;
  const totalHabits = habits.length;
  const urgentTasks = mockTasks.filter((tk) => tk.priority === 'urgent' && !tk.done);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <HomeHeader c={c} router={router} />
      <ViewToggle
        options={[
          { key: 'ai', label: t('home.ai'), emoji: '✨' },
          { key: 'dashboard', label: t('home.dashboard'), emoji: '📊' },
        ]}
        active={view}
        onChange={(v) => setView(v as HomeView)}
      />
      {view === 'ai' ? (
        <AIView msgs={msgs} input={input} setInput={setInput} sendMsg={sendMsg} c={c} t={t} />
      ) : (
        <DashView
          habits={habits}
          updateHabit={updateHabit}
          completedToday={completedToday}
          totalHabits={totalHabits}
          urgentTasks={urgentTasks}
          c={c}
          t={t}
          router={router}
        />
      )}
    </View>
  );
}

const HomeHeader = ({ c, router }: any) => {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[S.header, { paddingTop: top + 12 }]}>
      <View>
        <Text style={[S.logo, { color: c.t1 }]}>Life OS</Text>
        <Text style={[S.greeting, { color: c.t2 }]}>
          {new Date().getHours() < 12 ? '☀ صباح الخير' : '🌙 مساء الخير'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[S.iconBtn, { backgroundColor: c.bg2 }]}
        >
          <Ionicons name="settings-outline" size={20} color={c.t2} />
        </Pressable>
      </View>
    </View>
  );
};

// ── AI View ──────────────────────────────────────
const AIView = ({ msgs, input, setInput, sendMsg, c, t }: any) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    <FlatList
      data={msgs}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 180 }}
      keyExtractor={(m) => m.id}
      renderItem={({ item: m }) => (
        <View
          style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}
        >
          <View
            style={[
              S.bubble,
              {
                backgroundColor: m.role === 'user' ? c.accent : c.bg2,
                borderBottomEndRadius: m.role === 'user' ? 4 : 18,
                borderBottomStartRadius: m.role === 'assistant' ? 4 : 18,
              },
            ]}
          >
            <Text style={{ color: m.role === 'user' ? '#FFF' : c.t1, fontSize: 15, lineHeight: 23 }}>
              {m.text}
            </Text>
          </View>
        </View>
      )}
    />
    <View style={[S.inputArea, { backgroundColor: c.bg0 }]}>
      <MicButton
        size="large"
        onDone={(text) => {
          if (text) console.log('recorded:', text);
        }}
      />
      <View style={[S.inputRow, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
        <TextInput
          style={[S.textInput, { color: c.t1 }]}
          placeholder={t('home.type_here')}
          placeholderTextColor={c.t4}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMsg}
          returnKeyType="send"
        />
        {input.trim().length > 0 && (
          <Pressable onPress={sendMsg} style={[S.sendBtn, { backgroundColor: c.accent }]}>
            <Ionicons name="send" size={16} color="#FFF" />
          </Pressable>
        )}
      </View>
    </View>
  </KeyboardAvoidingView>
);

// ── Dashboard View ────────────────────────────────
const DashView = ({
  habits,
  updateHabit,
  completedToday,
  totalHabits,
  urgentTasks,
  c,
  t,
  router,
}: any) => (
  <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}>
    {/* Life OS Score */}
    <SmartCard accent={c.accent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 3,
            borderColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.accentDim,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.accent }}>82</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.t1 }}>Life OS Score</Text>
          <Text style={{ fontSize: 13, color: c.t2, marginTop: 3 }}>
            أداؤك هذا الأسبوع رائع — استمر! 🔥
          </Text>
        </View>
      </View>
    </SmartCard>

    {/* عادات اليوم */}
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Text style={[S.secTitle, { color: c.t2 }]}>{t('dash.habits')}</Text>
      <Pressable onPress={() => router.push('/(tabs)/more/habits')}>
        <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{t('habits.all')}</Text>
      </Pressable>
    </View>

    {/* Progress Bar */}
    <SmartCard accent={c.habits} padSize="sm">
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ color: c.t1, fontWeight: '600', fontSize: 15 }}>
          {completedToday} / {totalHabits} مكتملة
        </Text>
        <Text style={{ color: c.habits, fontWeight: '800', fontSize: 18 }}>
          {Math.round((completedToday / Math.max(totalHabits, 1)) * 100)}%
        </Text>
      </View>
      <View style={[S.pBg, { backgroundColor: c.b1 }]}>
        <View
          style={[
            S.pFill,
            {
              width: `${(completedToday / Math.max(totalHabits, 1)) * 100}%`,
              backgroundColor: c.habits,
            },
          ]}
        />
      </View>
    </SmartCard>

    {/* أول 3 عادات */}
    {habits.slice(0, 3).map((h: any) => (
      <HabitCard key={h.id} habit={h} onUpdate={updateHabit} />
    ))}

    {/* مهام عاجلة */}
    {urgentTasks.length > 0 && (
      <>
        <Text style={[S.secTitle, { color: c.t2, marginTop: 4 }]}>{t('dash.tasks_urgent')}</Text>
        <SmartCard accent={c.tasks}>
          {urgentTasks.map((task: any, i: number) => (
            <View
              key={task.id}
              style={[
                S.taskRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
              ]}
            >
              <View style={[S.tDot, { backgroundColor: c.red }]} />
              <Text style={{ flex: 1, color: c.t1, fontSize: 14 }}>{task.title}</Text>
              {task.due && <Text style={{ color: c.t3, fontSize: 12 }}>{task.due}</Text>}
            </View>
          ))}
        </SmartCard>
      </>
    )}

    {/* Streaks */}
    <Text style={[S.secTitle, { color: c.t2, marginTop: 4 }]}>🔥 {t('dash.streaks')}</Text>
    <SmartCard>
      {habits
        .filter((h: any) => h.streak > 0)
        .slice(0, 4)
        .map((h: any, i: number) => (
          <View
            key={h.id}
            style={[
              S.streakRow,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
            <Text style={{ color: c.t1, fontSize: 14, width: 100 }} numberOfLines={1}>
              {h.name}
            </Text>
            <View style={[S.pBg, { flex: 1, backgroundColor: c.b1 }]}>
              <View
                style={[
                  S.pFill,
                  { width: `${Math.min(h.streak / 30, 1) * 100}%`, backgroundColor: h.color },
                ]}
              />
            </View>
            <Text
              style={{
                color: '#F59E0B',
                fontWeight: '700',
                fontSize: 13,
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              🔥 {h.streak}
            </Text>
          </View>
        ))}
    </SmartCard>
  </ScrollView>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  greeting: { fontSize: 13, marginTop: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bubble: { padding: 14, borderRadius: 18 },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 10,
    gap: 12,
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  textInput: { flex: 1, fontSize: 15 },
  sendBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 13, fontWeight: '600' },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  tDot: { width: 7, height: 7, borderRadius: 3.5 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
