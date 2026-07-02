// app/(tabs)/more/study/[id].tsx
// Course detail — v3 premium: monochrome Ionicons, single accent, hairline
// glass, neutral surfaces. No emoji-as-icons, no per-course chrome tints.
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConnectedLayer } from '@/components/ui/ConnectedLayer';
import { mockCourses } from '@/data/mock';

export default function CourseDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = mockCourses.find((co) => co.id === id);

  if (!course) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.study')} />
        <EmptyState icon="school-outline" title={t('common.empty')} />
      </View>
    );
  }

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={course.name}
        subtitle={course.teacher}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/study/new-exam'), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard>
          <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 14 }}>
            <View style={[S.icon, { backgroundColor: c.bg3 }]}>
              <Ionicons name="book-outline" size={26} color={c.t1} />
              <View style={[S.iconDot, { backgroundColor: course.color }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 16, textAlign }}>
                {course.progress}% {t('study.completed')}
              </Text>
              <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Ionicons name="time-outline" size={13} color={c.t3} />
                <Text style={{ color: c.t2, fontSize: 12 }}>
                  {course.totalStudyHours} {t('study.total_hours')}
                </Text>
              </View>
              <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 8 }]}>
                <View style={[S.pFill, { width: `${course.progress}%`, backgroundColor: c.accent }]} />
              </View>
            </View>
          </View>
        </SmartCard>

        {/* Exams + AI plans */}
        <View style={[S.secTitle, { flexDirection: rowDir }]}>
          <Ionicons name="school-outline" size={15} color={c.t2} />
          <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{t('study.exam_name')}</Text>
        </View>
        {course.exams.map((exam) => (
          <SmartCard key={exam.id}>
            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, flex: 1, textAlign }}>{exam.name}</Text>
              <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 5 }}>
                <Ionicons name="calendar-clear-outline" size={13} color={c.t3} />
                <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{exam.date}</Text>
              </View>
            </View>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4, textAlign }}>
              {exam.chaptersCount} {t('study.chapters')} · {exam.studyHours} ساعة
            </Text>

            {exam.aiPlan.length > 0 ? (
              <View style={[S.planBox, { backgroundColor: c.accentDim, borderColor: c.accent + '40' }]}>
                <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="sparkles-outline" size={14} color={c.accent} />
                  <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>خطة المراجعة</Text>
                </View>
                {exam.aiPlan.map((step, i) => (
                  <View key={i} style={{ flexDirection: rowDir, gap: 8, paddingVertical: 3 }}>
                    <Text style={{ color: c.accent }}>•</Text>
                    <Text style={{ color: c.t2, fontSize: 13, flex: 1, textAlign }}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable style={[S.aiBtn, { flexDirection: rowDir, backgroundColor: c.accentDim, borderColor: c.accent + '40' }]}>
                <Ionicons name="sparkles-outline" size={15} color={c.accent} />
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>{t('study.gen_plan')}</Text>
              </Pressable>
            )}
          </SmartCard>
        ))}

        {/* Sessions */}
        <View style={[S.secTitle, { flexDirection: rowDir }]}>
          <Ionicons name="time-outline" size={15} color={c.t2} />
          <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{t('study.study_session')}</Text>
        </View>
        <SmartCard>
          <View style={{ flexDirection: rowDir, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.t2, fontSize: 14 }}>{t('study.total_hours')}</Text>
            <Text style={{ color: c.accent, fontWeight: '800', fontSize: 20 }}>{course.totalStudyHours}h</Text>
          </View>
          <Pressable style={[S.sessionBtn, { flexDirection: rowDir, borderColor: c.accent }]}>
            <Ionicons name="add" size={18} color={c.accent} />
            <Text style={{ color: c.accent, fontWeight: '600' }}>{t('study.study_session')}</Text>
          </Pressable>
        </SmartCard>

        {/* living connections: graph matches + study insights */}
        <ConnectedLayer query={course.name} domain="study" />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  icon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconDot: { position: 'absolute', bottom: 9, end: 9, width: 9, height: 9, borderRadius: 4.5 },
  secTitle: { alignItems: 'center', gap: 6, marginTop: 4 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  planBox: { marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  aiBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
