// app/trust-center.tsx
// Privacy is a first-class, visible feature — not fine print. Shows what's
// stored, what stays local, what's shared, and *why* the AI made a suggestion.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';

const ROWS = [
  { icon: 'phone-portrait-outline' as const, title: 'يبقى على جهازك', desc: 'يومياتك ومسوّداتك مخزّنة محلياً حتى تختار المزامنة.' },
  { icon: 'cloud-upload-outline' as const, title: 'يُخزَّن مشفّراً', desc: 'الملفات والصور والـ PDF في مساحة خاصة بك فقط.' },
  { icon: 'trash-outline' as const, title: 'يُحذف فوراً', desc: 'التسجيلات الصوتية تُحذف بعد التحويل إلى نص مباشرة.' },
  { icon: 'people-outline' as const, title: 'لا تتم المشاركة', desc: 'لا شيء يُشارك مع أحد إلا حين تشاركه أنت بنفسك.' },
];

export default function TrustCenterScreen() {
  const { c } = useTheme();
  const { rowDir, textAlign } = useRTL();
  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title="مركز الثقة" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}>
        <Text style={[S.intro, { color: c.t1, textAlign }]}>بياناتك ملكك — وهذه شفافية كاملة عمّا يحدث لها.</Text>

        {ROWS.map((r) => (
          <SmartCard key={r.title}>
            <View style={[S.row, { flexDirection: rowDir }]}>
              <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                <Ionicons name={r.icon} size={18} color={c.t1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontSize: 15, fontWeight: '700', textAlign }}>{r.title}</Text>
                <Text style={{ color: c.t2, fontSize: 13, marginTop: 3, lineHeight: 20, textAlign }}>{r.desc}</Text>
              </View>
            </View>
          </SmartCard>
        ))}

        {/* Why did the AI suggest this? */}
        <Text style={[S.label, { color: c.t3, textAlign }]}>لماذا اقترح الذكاء هذا؟</Text>
        <SmartCard accent={c.accent}>
          <View style={[S.row, { flexDirection: rowDir }]}>
            <Ionicons name="sparkles-outline" size={18} color={c.accent} />
            <Text style={{ flex: 1, color: c.t2, fontSize: 13, lineHeight: 21, textAlign }}>
              كل اقتراح يأتي مع سببه — مثل: «اقترحت مراجعة الفصل ١ لأن امتحانك بعد ٦ أيام وهذا أصعب فصل عندك».
              تقدر دائماً تسأل «ليش؟» وتحصل على إجابة واضحة.
            </Text>
          </View>
        </SmartCard>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  intro: { fontSize: 19, fontWeight: '700', lineHeight: 27 },
  row: { gap: 12, alignItems: 'flex-start' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 6 },
});
