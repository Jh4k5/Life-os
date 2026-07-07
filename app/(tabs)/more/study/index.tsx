// app/(tabs)/more/study/index.tsx
// Study hub — v3 premium: monochrome Ionicons, single accent, hairline glass.
// No emoji-as-icons, no per-section chrome tints. Exam countdown + readiness.
import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

const daysUntil = (date: string) => {
  const d = new Date(date).getTime() - Date.now();
  return Math.ceil(d / 86_400_000);
};

export default function StudyScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const { data: courses } = useAsync(() => repository.listCourses(), [], "courses");

  const totalHours = courses.reduce((s, co) => s + co.totalStudyHours, 0);
  const totalExams = courses.reduce((s, co) => s + co.exams.length, 0);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.study')}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/study/new-course'), color: c.accent }]}
      />

      <FlatList
        data={courses}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}
        keyExtractor={(co) => co.id}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <SmartCard>
              <View style={[S.stats, { flexDirection: rowDir }]}>
                <Stat icon="library-outline" val={courses.length} label={t('study.course_name')} c={c} />
                <View style={[S.divider, { backgroundColor: c.b1 }]} />
                <Stat icon="school-outline" val={totalExams} label={t('study.exam_name')} c={c} />
                <View style={[S.divider, { backgroundColor: c.b1 }]} />
                <Stat icon="time-outline" val={`${totalHours}h`} label={t('study.total_hours')} c={c} />
              </View>
            </SmartCard>
            <Pressable onPress={() => router.push('/(tabs)/more/study/flashcards')}>
              <SmartCard padSize="sm">
                <View style={[S.reviewRow, { flexDirection: rowDir }]}>
                  <View style={[S.reviewIcon, { backgroundColor: c.accentDim }]}>
                    <Ionicons name="albums-outline" size={18} color={c.accent} />
                  </View>
                  <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>
                    {t('study.review_cards')}
                  </Text>
                  <Ionicons name={rowDir === 'row-reverse' ? 'chevron-back' : 'chevron-forward'} size={18} color={c.t3} />
                </View>
              </SmartCard>
            </Pressable>
          </View>
        }
        renderItem={({ item: co }) => {
          const nextExam = [...co.exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          const dleft = nextExam ? daysUntil(nextExam.date) : null;
          return (
            <Pressable onPress={() => router.push(`/(tabs)/more/study/${co.id}`)}>
              <SmartCard>
                <View style={[S.head, { flexDirection: rowDir }]}>
                  <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                    <Ionicons name="book-outline" size={22} color={c.t1} />
                    <View style={[S.iconDot, { backgroundColor: co.color }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.name, { color: c.t1, textAlign }]} numberOfLines={1}>
                      {co.name}
                    </Text>
                    <Text style={[S.teacher, { color: c.t3, textAlign }]} numberOfLines={1}>
                      {co.teacher}
                    </Text>
                  </View>
                  <View style={[S.statusPill, { flexDirection: rowDir, backgroundColor: c.bg3 }]}>
                    <View
                      style={[S.dot, { backgroundColor: co.status === 'active' ? c.green : c.t3 }]}
                    />
                    <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>
                      {co.status === 'active' ? t('study.active') : t('study.completed')}
                    </Text>
                  </View>
                </View>

                {/* progress */}
                <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 14 }]}>
                  <View style={[S.pFill, { width: `${co.progress}%`, backgroundColor: c.accent }]} />
                </View>
                <View style={[S.progRow, { flexDirection: rowDir }]}>
                  <Text style={{ color: c.t3, fontSize: 12 }}>
                    {co.progress}% · {co.totalStudyHours}h
                  </Text>
                  {dleft != null && (
                    <View style={[S.countdown, { flexDirection: rowDir, backgroundColor: dleft <= 7 ? c.accentDim : c.bg3 }]}>
                      <Ionicons name="hourglass-outline" size={12} color={dleft <= 7 ? c.accent : c.t3} />
                      <Text style={{ color: dleft <= 7 ? c.accent : c.t3, fontSize: 11, fontWeight: '700' }}>
                        {dleft > 0 ? `بعد ${dleft} يوم` : 'اليوم'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* exams */}
                {co.exams.map((exam) => (
                  <View key={exam.id} style={[S.examRow, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                    <Ionicons name="calendar-clear-outline" size={15} color={c.t3} />
                    <Text style={{ color: c.t1, flex: 1, fontSize: 14, textAlign }} numberOfLines={1}>
                      {exam.name}
                    </Text>
                    <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>{exam.date}</Text>
                  </View>
                ))}

                {/* AI plan */}
                <Pressable style={[S.aiBtn, { flexDirection: rowDir, backgroundColor: c.accentDim, borderColor: c.accent + '40' }]}>
                  <Ionicons name="sparkles-outline" size={15} color={c.accent} />
                  <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>{t('study.gen_plan')}</Text>
                </Pressable>
              </SmartCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: c.bg2 }]}>
              <Ionicons name="school-outline" size={32} color={c.t3} />
            </View>
            <Text style={{ color: c.t3, fontSize: 15, textAlign: 'center' }}>{t('study.empty')}</Text>
            <Pressable onPress={() => router.push('/(tabs)/more/study/new-course')} style={[S.addBtn, { backgroundColor: c.accent }]}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('study.new_course')}</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const Stat = ({ icon, val, label, c }: any) => (
  <View style={{ alignItems: 'center', flex: 1, gap: 4 }}>
    <Ionicons name={icon} size={18} color={c.t2} />
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 19 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  stats: { alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 6 },
  reviewRow: { alignItems: 'center', gap: 12 },
  reviewIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconDot: { position: 'absolute', bottom: 7, end: 7, width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  teacher: { fontSize: 13, marginTop: 2 },
  statusPill: { alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  progRow: { justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  countdown: { alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  examRow: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  aiBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  empty: { alignItems: 'center', paddingVertical: 70, gap: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
});
