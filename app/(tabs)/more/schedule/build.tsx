// app/(tabs)/more/schedule/build.tsx
// Smart Schedule Builder — upload a photo/PDF of an exam schedule; it becomes a
// structured schedule + checklist + revision sessions + reminders, surfacing
// conflicts. Parsing runs through the real OCR + AI seam (scheduleService).
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { Button } from '@/components/ui/Button';
import { captureService } from '@/services/captureService';
import { scheduleService, type BuiltSchedule } from '@/services/scheduleService';
import { repository } from '@/services/repository';
import type { DetectedItem } from '@/services/types';

export default function ScheduleBuilderScreen() {
  const { c } = useTheme();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [built, setBuilt] = useState<BuiltSchedule | null>(null);
  const [applied, setApplied] = useState<{ saved: number; demo: boolean } | null>(null);

  const pickAndBuild = async () => {
    setBusy(true);
    setApplied(null);
    const image = await captureService.captureImage();
    if (!image) {
      // No image (cancelled / web) — still demonstrate the flow honestly.
      const res = await scheduleService.fromImage({ uri: '', mimeType: 'image/jpeg' });
      setBuilt(res);
      setBusy(false);
      return;
    }
    const res = await scheduleService.fromImage(image);
    setBuilt(res);
    setBusy(false);
  };

  const apply = async () => {
    if (!built) return;
    const items: DetectedItem[] = built.sessions.map((s, i) => ({
      id: `b_${i}`,
      type: 'task',
      title: s.title,
      confidence: 0.9,
      status: 'accepted',
    }));
    const res = await repository.persistAccepted(items);
    setApplied({ saved: res.saved, demo: res.demo });
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title="باني الجدول الذكي" accent={c.accent} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}>
        {!built && !busy && (
          <Pressable onPress={pickAndBuild}>
            <SmartCard>
              <View style={S.drop}>
                <View style={[S.dropIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name="cloud-upload-outline" size={28} color={c.accent} />
                </View>
                <Text style={{ color: c.t1, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                  ارفع صورة أو PDF لجدول الامتحان
                </Text>
                <Text style={{ color: c.t3, fontSize: 13, textAlign: 'center' }}>
                  وسأحوّله إلى جلسات مراجعة وقائمة وتذكيرات — وأنبّهك للتعارضات.
                </Text>
              </View>
            </SmartCard>
          </Pressable>
        )}

        {busy && (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 50 }}>
            <ActivityIndicator color={c.accent} />
            <Text style={{ color: c.t2 }}>أقرأ الجدول وأرتّبه…</Text>
          </View>
        )}

        {built && (
          <>
            <Text style={[S.title, { color: c.t1, textAlign }]}>{built.title}</Text>

            <Section title="جلسات المراجعة" icon="time-outline" c={c} rowDir={rowDir}>
              {built.sessions.map((s, i) => (
                <Row key={s.id} c={c} rowDir={rowDir} textAlign={textAlign} top={i > 0} label={s.title} />
              ))}
            </Section>

            <Section title="قائمة التحضير" icon="list-outline" c={c} rowDir={rowDir}>
              {built.checklist.map((s, i) => (
                <Row key={s.id} c={c} rowDir={rowDir} textAlign={textAlign} top={i > 0} label={s.label} check />
              ))}
            </Section>

            <Section title="تذكيرات" icon="notifications-outline" c={c} rowDir={rowDir}>
              {built.reminders.map((r, i) => (
                <Row key={i} c={c} rowDir={rowDir} textAlign={textAlign} top={i > 0} label={r} />
              ))}
            </Section>

            {built.conflicts.length > 0 ? (
              <SmartCard accent={c.red}>
                <Text style={{ color: c.red, fontWeight: '700', fontSize: 13, textAlign }}>تعارضات في الوقت</Text>
                {built.conflicts.map((cf, i) => (
                  <Text key={i} style={{ color: c.t2, fontSize: 13, marginTop: 4, textAlign }}>
                    • {cf}
                  </Text>
                ))}
              </SmartCard>
            ) : (
              <View style={[S.ok, { backgroundColor: c.greenDim, flexDirection: rowDir }]}>
                <Ionicons name="checkmark-circle" size={16} color={c.green} />
                <Text style={{ color: c.green, fontSize: 13 }}>لا تعارضات في الوقت</Text>
              </View>
            )}

            {applied ? (
              <View style={[S.ok, { backgroundColor: c.greenDim, flexDirection: rowDir }]}>
                <Ionicons name="checkmark-circle" size={16} color={c.green} />
                <Text style={{ color: c.green, fontSize: 13 }}>
                  {`أُضيفت ${applied.saved} جلسة لمهامك`}
                </Text>
              </View>
            ) : (
              <Button label="أضِف للجدول والمهام" icon="add" onPress={apply} color={c.accent} />
            )}
            <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: c.t3, fontSize: 14 }}>تم</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Section = ({ title, icon, c, rowDir, children }: any) => (
  <View style={{ gap: 8 }}>
    <View style={[{ alignItems: 'center', gap: 6, paddingHorizontal: 4 }, { flexDirection: rowDir }]}>
      <Ionicons name={icon} size={15} color={c.t3} />
      <Text style={{ color: c.t3, fontSize: 13, fontWeight: '700' }}>{title}</Text>
    </View>
    <SmartCard noPad>{children}</SmartCard>
  </View>
);

const Row = ({ c, rowDir, textAlign, top, label, check }: any) => (
  <View
    style={[
      { alignItems: 'center', gap: 12, padding: 14, flexDirection: rowDir },
      top && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 },
    ]}
  >
    {check ? (
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: c.b2 }} />
    ) : (
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
    )}
    <Text style={{ flex: 1, color: c.t1, fontSize: 14, textAlign }}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  drop: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  dropIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  ok: { alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
});
