// app/(tabs)/more/study/index.tsx
// Study Workspace — rebuilt on the design system (ui-ux-pro-max).
// Single-accent chrome, Ionicons (no emoji), token colors, i18n, RTL-safe.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import {
  SmartCard,
  StatRow,
  IconTile,
  Badge,
  ProgressBar,
  Chip,
  Button,
  EmptyState,
} from '@/components/ui';
import { mockCourses, type Course, type Exam } from '@/data/mock';

type Filter = 'all' | 'active' | 'completed';

export default function StudyScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  // NOTE: still mock-backed — pending studyRepo swap (Workstream A). The screen
  // is structured so the data source can move behind a repository read.
  const courses = mockCourses;

  const totalHours = courses.reduce((s, co) => s + co.totalStudyHours, 0);
  const totalExams = courses.reduce((s, co) => s + co.exams.length, 0);

  const filtered = useMemo(
    () =>
      courses.filter((co) =>
        filter === 'all' ? true : filter === 'active' ? co.status === 'active' : co.status === 'completed',
      ),
    [courses, filter],
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.study')}
        right={[
          { icon: 'add', onPress: () => router.push('/(tabs)/more/study/new-course'), color: c.accent },
        ]}
      />

      <FlatList
        data={filtered}
        keyExtractor={(co) => co.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Overview */}
            <SmartCard style={{ marginTop: 8 }}>
              <StatRow
                stats={[
                  { icon: 'library-outline', value: courses.length, label: t('study.subjects') },
                  { icon: 'school-outline', value: totalExams, label: t('study.exams_count') },
                  { icon: 'time-outline', value: totalHours, label: t('study.hours_short') },
                ]}
              />
            </SmartCard>

            {/* Filters */}
            <View style={[S.filters, { flexDirection: rowDir }]}>
              <Chip label={t('learning.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={t('study.active')} selected={filter === 'active'} onPress={() => setFilter('active')} />
              <Chip
                label={t('study.completed')}
                selected={filter === 'completed'}
                onPress={() => setFilter('completed')}
              />
            </View>
          </View>
        }
        renderItem={({ item: co }) => (
          <CourseCard
            course={co}
            c={c}
            t={t}
            rowDir={rowDir}
            textAlign={textAlign}
            onOpen={() => router.push(`/(tabs)/more/study/${co.id}`)}
            onPlan={() => router.push('/(tabs)/more/schedule/build')}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title={t('study.empty')}
            action={{
              label: t('study.new_course'),
              icon: 'add',
              onPress: () => router.push('/(tabs)/more/study/new-course'),
            }}
          />
        }
      />
    </View>
  );
}

function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const CourseCard = ({
  course: co,
  c,
  t,
  rowDir,
  textAlign,
  onOpen,
  onPlan,
}: {
  course: Course;
  c: ReturnType<typeof useTheme>['c'];
  t: (k: string, o?: any) => string;
  rowDir: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
  onOpen: () => void;
  onPlan: () => void;
}) => {
  const statusTone = co.status === 'active' ? 'green' : co.status === 'paused' ? 'yellow' : 'neutral';
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <SmartCard>
        {/* Header */}
        <View style={[S.cardHead, { flexDirection: rowDir }]}>
          <IconTile icon="book-outline" size="lg" />
          <View style={{ flex: 1 }}>
            <Text style={[S.name, { color: c.t1, textAlign }]} numberOfLines={1}>
              {co.name}
            </Text>
            <Text style={[S.teacher, { color: c.t2, textAlign }]} numberOfLines={1}>
              {co.teacher}
            </Text>
          </View>
          <Badge label={t(`study.${co.status}`)} tone={statusTone as any} />
        </View>

        {/* Progress */}
        <View style={{ marginTop: 14 }}>
          <ProgressBar progress={co.progress / 100} />
          <Text style={[S.meta, { color: c.t3, textAlign }]}>
            {t('study.pct_complete', { pct: co.progress })} · {t('study.hours_studied', { n: co.totalStudyHours })}
          </Text>
        </View>

        {/* Exams */}
        {co.exams.map((exam) => (
          <ExamRow key={exam.id} exam={exam} c={c} t={t} rowDir={rowDir} textAlign={textAlign} />
        ))}

        {/* AI revision plan */}
        <Button
          label={t('study.gen_plan')}
          icon="sparkles-outline"
          variant="soft"
          onPress={onPlan}
          style={{ height: 44, marginTop: 12 }}
        />
      </SmartCard>
    </Pressable>
  );
};

const ExamRow = ({
  exam,
  c,
  t,
  rowDir,
  textAlign,
}: {
  exam: Exam;
  c: ReturnType<typeof useTheme>['c'];
  t: (k: string, o?: any) => string;
  rowDir: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
}) => {
  const d = daysUntil(exam.date);
  const countdown =
    d < 0 ? t('study.exam_past') : d === 0 ? t('study.exam_today') : t('study.exam_in_days', { n: d });
  const tone = d < 0 ? 'neutral' : d <= 3 ? 'red' : d <= 7 ? 'yellow' : 'accent';
  return (
    <View style={[S.examRow, { borderTopColor: c.b0, flexDirection: rowDir }]}>
      <Ionicons name="calendar-outline" size={15} color={c.t3} />
      <Text style={[S.examName, { color: c.t1, textAlign }]} numberOfLines={1}>
        {exam.name}
      </Text>
      <Badge label={countdown} tone={tone as any} size="sm" />
    </View>
  );
};

const S = StyleSheet.create({
  screen: { flex: 1 },
  filters: { gap: 8, marginTop: 14, marginBottom: 4 },
  cardHead: { alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  teacher: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 8 },
  examRow: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  examName: { flex: 1, fontSize: 14, fontWeight: '500' },
});
