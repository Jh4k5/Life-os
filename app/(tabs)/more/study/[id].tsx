// app/(tabs)/more/study/[id].tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockCourses } from '@/data/mock';

export default function CourseDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = mockCourses.find((co) => co.id === id);

  if (!course) {
    return (
      <View style={[S.screen, { backgroundColor: c.bg0 }]}>
        <Header title={t('sections.study')} accent={c.study} />
        <EmptyState emoji="🎓" title={t('common.empty')} />
      </View>
    );
  }

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={course.name}
        subtitle={course.teacher}
        accent={course.color}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/study/new-exam'), color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Hero */}
        <SmartCard accent={course.color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[S.icon, { backgroundColor: course.color + '22' }]}>
              <Text style={{ fontSize: 30 }}>{course.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 16 }}>
                {course.progress}% {t('study.completed')}
              </Text>
              <Text style={{ color: c.t2, fontSize: 12, marginTop: 2 }}>
                ⏱ {course.totalStudyHours} {t('study.total_hours')}
              </Text>
              <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 8 }]}>
                <View style={[S.pFill, { width: `${course.progress}%`, backgroundColor: course.color }]} />
              </View>
            </View>
          </View>
        </SmartCard>

        {/* Exams + AI plans */}
        <Text style={[S.secTitle, { color: c.t2 }]}>🎓 {t('study.exam_name')}</Text>
        {course.exams.map((exam) => (
          <SmartCard key={exam.id} accent={course.color}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, flex: 1 }}>{exam.name}</Text>
              <Text style={{ color: course.color, fontSize: 13, fontWeight: '600' }}>📅 {exam.date}</Text>
            </View>
            <Text style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>
              {exam.chaptersCount} {t('study.chapters')} · {exam.studyHours} ساعة
            </Text>

            {exam.aiPlan.length > 0 ? (
              <View style={[S.planBox, { backgroundColor: course.color + '12', borderColor: course.color + '30' }]}>
                <Text style={{ color: course.color, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>
                  🤖 خطة المراجعة
                </Text>
                {exam.aiPlan.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
                    <Text style={{ color: course.color }}>•</Text>
                    <Text style={{ color: c.t2, fontSize: 13, flex: 1 }}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable style={[S.aiBtn, { backgroundColor: course.color + '22', borderColor: course.color + '55' }]}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
                <Text style={{ color: course.color, fontWeight: '600', fontSize: 14 }}>{t('study.gen_plan')}</Text>
              </Pressable>
            )}
          </SmartCard>
        ))}

        {/* Sessions */}
        <Text style={[S.secTitle, { color: c.t2 }]}>⏱ {t('study.study_session')}</Text>
        <SmartCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.t2, fontSize: 14 }}>{t('study.total_hours')}</Text>
            <Text style={{ color: course.color, fontWeight: '800', fontSize: 20 }}>{course.totalStudyHours}h</Text>
          </View>
          <Pressable style={[S.sessionBtn, { borderColor: course.color }]}>
            <Ionicons name="add" size={18} color={course.color} />
            <Text style={{ color: course.color, fontWeight: '600' }}>{t('study.study_session')}</Text>
          </Pressable>
        </SmartCard>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  icon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  planBox: { marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionBtn: {
    flexDirection: 'row',
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
