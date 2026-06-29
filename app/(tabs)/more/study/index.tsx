// app/(tabs)/more/study/index.tsx
import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SmartCard } from '@/components/ui/SmartCard';
import { Header } from '@/components/layout/Header';
import { mockCourses } from '@/data/mock';

export default function StudyScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const totalHours = mockCourses.reduce((s, co) => s + co.totalStudyHours, 0);
  const totalExams = mockCourses.reduce((s, co) => s + co.exams.length, 0);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.study')}
        accent={c.study}
        right={[{ icon: 'add', onPress: () => router.push('/(tabs)/more/study/new-course'), color: c.accent }]}
      />
      {/* Stats bar */}
      <View style={[S.statsBar, { backgroundColor: c.study + '15', borderBottomColor: c.study + '30' }]}>
        <StatChip icon="📚" val={mockCourses.length} label="مادة" color={c.study} c={c} />
        <View style={[S.divider, { backgroundColor: c.study + '40' }]} />
        <StatChip icon="🎓" val={totalExams} label="امتحان" color={c.study} c={c} />
        <View style={[S.divider, { backgroundColor: c.study + '40' }]} />
        <StatChip icon="⏱" val={totalHours} label="ساعة مذاكرة" color={c.study} c={c} />
      </View>
      <FlatList
        data={mockCourses}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}
        keyExtractor={(co) => co.id}
        renderItem={({ item: co }) => (
          <Pressable onPress={() => router.push(`/(tabs)/more/study/${co.id}`)}>
            <SmartCard accent={co.color}>
              {/* Course Header */}
              <View style={S.courseHeader}>
                <View style={[S.courseIcon, { backgroundColor: co.color + '22' }]}>
                  <Text style={{ fontSize: 26 }}>{co.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.courseName, { color: c.t1 }]}>{co.name}</Text>
                  <Text style={[S.courseTeacher, { color: c.t2 }]}>{co.teacher}</Text>
                </View>
                <View style={[S.statusBadge, { backgroundColor: c.study + '22' }]}>
                  <Text style={{ color: c.study, fontSize: 12, fontWeight: '600' }}>
                    {co.status === 'active' ? '🟢 جارية' : '✅ مكتملة'}
                  </Text>
                </View>
              </View>
              {/* Progress */}
              <View style={[S.pBg, { backgroundColor: c.b1, marginVertical: 10 }]}>
                <View style={[S.pFill, { width: `${co.progress}%`, backgroundColor: co.color }]} />
              </View>
              <Text style={{ color: c.t2, fontSize: 12, marginBottom: 10 }}>
                {co.progress}% مكتمل · {co.totalStudyHours} ساعة مذاكرة
              </Text>
              {/* Exams */}
              {co.exams.map((exam) => (
                <View key={exam.id} style={[S.examRow, { borderTopColor: c.b0 }]}>
                  <Ionicons name="calendar-outline" size={14} color={c.study} />
                  <Text style={{ color: c.t1, flex: 1, fontSize: 14 }}>{exam.name}</Text>
                  <Text style={{ color: c.study, fontSize: 12, fontWeight: '600' }}>📅 {exam.date}</Text>
                </View>
              ))}
              {/* AI Plan Button */}
              <Pressable style={[S.aiPlanBtn, { backgroundColor: c.study + '22', borderColor: c.study + '55' }]}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
                <Text style={{ color: c.study, fontWeight: '600', fontSize: 14 }}>
                  توليد خطة مراجعة بالذكاء الاصطناعي
                </Text>
              </Pressable>
            </SmartCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={{ fontSize: 50 }}>🎓</Text>
            <Text style={{ color: c.t3, fontSize: 16, textAlign: 'center' }}>{t('study.empty')}</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/more/study/new-course')}
              style={[S.addBtn, { backgroundColor: c.study }]}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>+ إضافة مادة</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const StatChip = ({ icon, val, label, color, c }: any) => (
  <View style={{ alignItems: 'center', flex: 1, gap: 2 }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ color, fontWeight: '800', fontSize: 18 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  statsBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  divider: { width: 1, height: 40, marginHorizontal: 8 },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  courseIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  courseName: { fontSize: 16, fontWeight: '700' },
  courseTeacher: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  aiPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  addBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
});
