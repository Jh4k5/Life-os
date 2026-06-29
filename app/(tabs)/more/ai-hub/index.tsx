// app/(tabs)/more/ai-hub/index.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';

const INIT = [
  {
    id: '1',
    role: 'assistant',
    text: 'أنا مركز القيادة 🤖 — أخبرني بما تريد وسأنفّذه في أي قسم. جرّب أحد القوالب بالأسفل.',
  },
];

export default function AIHubScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [msgs, setMsgs] = useState(INIT);
  const [input, setInput] = useState('');

  const templates = [
    { icon: '🎯', tkey: 'ai_hub.gen_plan_90' },
    { icon: '📊', tkey: 'ai_hub.weekly_review' },
    { icon: '🧠', tkey: 'ai_hub.skill_plan' },
    { icon: '💎', tkey: 'ai_hub.habit_system' },
  ];

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: content };
    const aiReply = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: 'فهمت طلبك! سأنشئ ذلك في القسم المناسب وأربطه ببياناتك السابقة. (واجهة تجريبية — بدون backend)',
    };
    setMsgs((p) => [...p, userMsg, aiReply]);
    setInput('');
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.ai_hub')}
        accent={c.ai_hub}
        right={[{ icon: 'sparkles-outline', onPress: () => {}, color: c.ai_hub }]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <FlatList
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 160 }}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 6 }}>
              <SmartCard accent={c.ai_hub} padSize="sm">
                <Text style={{ color: c.ai_hub, fontWeight: '700', fontSize: 13 }}>🧠 {t('ai_hub.memory')}</Text>
                <Text style={{ color: c.t2, fontSize: 12, marginTop: 4 }}>
                  يتذكر تفضيلاتك وأهدافك، ويربط محادثاتك السابقة، ويتعلم أسلوبك بمرور الوقت.
                </Text>
              </SmartCard>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {templates.map((tpl) => (
                    <Pressable
                      key={tpl.tkey}
                      onPress={() => send(t(tpl.tkey))}
                      style={[S.tpl, { backgroundColor: c.ai_hub + '18', borderColor: c.ai_hub + '40' }]}
                    >
                      <Text style={{ fontSize: 14 }}>{tpl.icon}</Text>
                      <Text style={{ color: c.ai_hub, fontSize: 13, fontWeight: '600' }}>{t(tpl.tkey)}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          }
          renderItem={({ item: m }) => (
            <View style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              <View
                style={[
                  S.bubble,
                  {
                    backgroundColor: m.role === 'user' ? c.ai_hub : c.bg2,
                    borderBottomEndRadius: m.role === 'user' ? 4 : 18,
                    borderBottomStartRadius: m.role === 'assistant' ? 4 : 18,
                  },
                ]}
              >
                <Text style={{ color: m.role === 'user' ? '#FFF' : c.t1, fontSize: 15, lineHeight: 23 }}>{m.text}</Text>
              </View>
            </View>
          )}
        />
        <View style={[S.inputArea, { backgroundColor: c.bg0 }]}>
          <View style={[S.inputRow, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
            <TextInput
              style={[S.textInput, { color: c.t1 }]}
              placeholder={t('ai_hub.ask_ph')}
              placeholderTextColor={c.t4}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              multiline
            />
            <Pressable onPress={() => send()} style={[S.sendBtn, { backgroundColor: c.ai_hub }]}>
              <Ionicons name="send" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  tpl: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  bubble: { padding: 14, borderRadius: 18 },
  inputArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 90, paddingTop: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
