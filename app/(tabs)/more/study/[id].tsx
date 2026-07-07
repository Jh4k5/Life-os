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
import { ReviewLayer } from '@/components/ai/ReviewLayer';
import { type Flashcard } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import type { DetectedItem, ReviewAction } from '@/services/types';

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

/** Honest readiness estimate: progress + plan existence + time margin. */
function readinessOf(progress: number, hasPlan: boolean, daysLeft: number | null): number {
  let r = Math.round(progress * 0.7);
  if (hasPlan) r += 20;
  if (daysLeft !== null && daysLeft > 7) r += 10;
  return Math.max(0, Math.min(100, r));
}

export default function CourseDetailScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: courses } = useAsync(() => repository.listCourses(), []);
  const course = courses.find((co) => co.id === id);

  // weak topics = low-ease cards that HAVE been reviewed (real SRS history)
  const { data: cards } = useAsync(() => repository.listFlashcards(id), []);
  const weak: Flashcard[] = cards.filter((f) => f.reps > 0 && f.ease < 2.3).slice(0, 4);

  // revision planner → Review Layer → events (nothing written unapproved)
  const [plan, setPlan] = React.useState<DetectedItem[] | null>(null);
  const [planApplied, setPlanApplied] = React.useState(false);
  const genPlan = (examName: string, chapters: number, daysLeft: number | null) => {
    const n = Math.max(1, Math.min(chapters || 3, 7));
    const items: DetectedItem[] = Array.from({ length: n }, (_, i) => ({
      id: `plan_${Date.now()}_${i}`,
      type: 'appointment',
      title: `مراجعة ${course?.name ?? ''} — ${examName}: ${i + 1}/${n}`,
      detail: daysLeft !== null ? `خلال ${Math.max(daysLeft, n)} يوم` : undefined,
      confidence: 0.9,
      status: 'pending',
    }));
    setPlan(items);
    setPlanApplied(false);
  };
  const onPlanAction = (itemId: string, action: ReviewAction) => {
    setPlan((p) =>
      (p ?? [])
        .map((it) =>
          it.id === itemId
            ? { ...it, status: action === 'accept' ? ('accepted' as const) : action === 'ignore' ? ('ignored' as const) : it.status }
            : it
        )
        .filter((it) => !(it.id === itemId && action === 'delete'))
    );
  };
  const applyPlan = async () => {
    const next = (plan ?? []).map((it) => (it.status === 'pending' ? { ...it, status: 'accepted' as const } : it));
    await repository.persistAccepted(next);
    setPlan(null);
    setPlanApplied(true);
  };

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
        {course.exams.map((exam) => {
          const dleft = exam.date ? daysUntil(exam.date) : null;
          const readiness = readinessOf(course.progress, exam.aiPlan.length > 0, dleft);
          return (
          <SmartCard key={exam.id}>
            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, flex: 1, textAlign }}>{exam.name}</Text>
              <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 5 }}>
                <Ionicons name="calendar-clear-outline" size={13} color={c.t3} />
                <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{exam.date}</Text>
              </View>
            </View>
            <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ color: c.t3, fontSize: 12, flex: 1, textAlign }}>
                {exam.chaptersCount} {t('study.chapters')} · {exam.studyHours} ساعة
              </Text>
              <View style={[S.readyPill, { flexDirection: rowDir, backgroundColor: readiness >= 60 ? c.bg3 : c.accentDim }]}>
                <Ionicons name="speedometer-outline" size={12} color={readiness >= 60 ? c.t2 : c.accent} />
                <Text style={{ color: readiness >= 60 ? c.t2 : c.accent, fontSize: 11, fontWeight: '700' }}>
                  {t('study.readiness')} {readiness}%
                </Text>
              </View>
            </View>

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
              <Pressable
                onPress={() => genPlan(exam.name, exam.chaptersCount, dleft)}
                style={[S.aiBtn, { flexDirection: rowDir, backgroundColor: c.accentDim, borderColor: c.accent + '40' }]}
              >
                <Ionicons name="sparkles-outline" size={15} color={c.accent} />
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 14 }}>{t('study.gen_plan')}</Text>
              </Pressable>
            )}
          </SmartCard>
          );
        })}

        {/* Revision planner — nothing is written without the Review Layer */}
        {plan && <ReviewLayer items={plan} onAction={onPlanAction} onApplyAll={applyPlan} compact />}
        {planApplied && (
          <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <Ionicons name="checkmark-circle-outline" size={16} color={c.green} />
            <Text style={{ color: c.t2, fontSize: 13 }}>{t('study.plan_applied')}</Text>
          </View>
        )}

        {/* Weak topics — real SRS history (low-ease reviewed cards) */}
        {weak.length > 0 && (
          <>
            <View style={[S.secTitle, { flexDirection: rowDir }]}>
              <Ionicons name="trending-down-outline" size={15} color={c.t2} />
              <Text style={{ color: c.t2, fontSize: 13, fontWeight: '600' }}>{t('study.weak_topics')}</Text>
            </View>
            <View style={{ flexDirection: rowDir, flexWrap: 'wrap', gap: 8 }}>
              {weak.map((f) => (
                <View key={f.id} style={[S.weakChip, { flexDirection: rowDir, backgroundColor: c.bg2, borderColor: c.b1 }]}>
                  <Ionicons name="alert-circle-outline" size={12} color={c.orange} />
                  <Text style={{ color: c.t2, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                    {f.front}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

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
  readyPill: { alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  weakChip: { alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, maxWidth: '48%' },
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
