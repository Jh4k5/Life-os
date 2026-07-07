// app/(tabs)/more/study/flashcards.tsx
// Flashcard review — real SM-2 spaced repetition. Tap to flip, then grade
// (Again/Good/Easy); each grade persists the next schedule via the repository.
// v3 premium: single accent, hairline glass, monochrome Ionicons, motion.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { useHaptics } from '@/hooks/useHaptics';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { type Flashcard } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { REVIEW_GRADES } from '@/services/srs';

export default function FlashcardsScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir } = useRTL();
  const haptics = useHaptics();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const { data: initial, loading } = useAsync(() => repository.listDueFlashcards(courseId), []);

  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  // seed the working queue once data arrives
  React.useEffect(() => {
    if (queue === null && initial.length >= 0 && !loading) setQueue(initial);
  }, [initial, loading, queue]);

  const cards = queue ?? initial;
  const total = cards.length;
  const card = cards[idx];

  const grade = async (g: number) => {
    if (!card) return;
    haptics.select();
    await repository.reviewFlashcard(card, g);
    setReviewed((r) => r + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  const gradeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    again: 'refresh-outline',
    good: 'checkmark-outline',
    easy: 'sparkles-outline',
  };
  const gradeColor: Record<string, string> = { again: c.orange, good: c.accent, easy: c.green };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('study.flashcards')} />

      {total === 0 ? (
        <EmptyState icon="albums-outline" title={t('study.no_cards_due')} />
      ) : idx >= total ? (
        <Animated.View entering={FadeIn} style={S.doneWrap}>
          <View style={[S.doneIcon, { backgroundColor: c.accentDim }]}>
            <Ionicons name="checkmark-done" size={40} color={c.accent} />
          </View>
          <Text style={{ color: c.t1, fontSize: 20, fontWeight: '800' }}>{t('study.review_done')}</Text>
          <Text style={{ color: c.t3, fontSize: 14 }}>
            {reviewed} {t('study.cards_due')}
          </Text>
        </Animated.View>
      ) : (
        <View style={S.body}>
          {/* progress */}
          <View style={[S.progRow, { flexDirection: rowDir }]}>
            <Text style={{ color: c.t3, fontSize: 13, fontVariant: ['tabular-nums'] }}>
              {idx + 1} / {total}
            </Text>
            <View style={[S.pBg, { backgroundColor: c.b1 }]}>
              <View style={[S.pFill, { width: `${(idx / total) * 100}%`, backgroundColor: c.accent }]} />
            </View>
          </View>

          {/* card */}
          <Pressable style={{ flex: 1 }} onPress={() => setFlipped((f) => !f)}>
            <Animated.View key={`${card.id}-${flipped}`} entering={FadeIn.duration(160)} style={{ flex: 1 }}>
              <SmartCard style={S.card}>
                <View style={[S.faceTag, { backgroundColor: c.bg3 }]}>
                  <Text style={{ color: c.t3, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                    {flipped ? 'B' : 'A'}
                  </Text>
                </View>
                <Text style={[S.face, { color: c.t1 }]}>{flipped ? card.back : card.front}</Text>
                <View style={[S.flipHint, { flexDirection: rowDir }]}>
                  <Ionicons name="sync-outline" size={13} color={c.t4} />
                  <Text style={{ color: c.t4, fontSize: 12 }}>{t('study.tap_to_flip')}</Text>
                </View>
              </SmartCard>
            </Animated.View>
          </Pressable>

          {/* grades — only after flip */}
          {flipped && (
            <Animated.View entering={FadeInDown.duration(180)} style={[S.grades, { flexDirection: rowDir }]}>
              {REVIEW_GRADES.map((g) => (
                <Pressable
                  key={g.key}
                  onPress={() => grade(g.grade)}
                  style={[S.gradeBtn, { backgroundColor: c.bg2, borderColor: gradeColor[g.key] + '55' }]}
                >
                  <Ionicons name={gradeIcon[g.key]} size={20} color={gradeColor[g.key]} />
                  <Text style={{ color: c.t1, fontWeight: '700', fontSize: 13 }}>{t(g.labelKey)}</Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, padding: 16, gap: 16, paddingBottom: 32 },
  progRow: { alignItems: 'center', gap: 12 },
  pBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  faceTag: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  face: { fontSize: 30, fontWeight: '800', textAlign: 'center', lineHeight: 40 },
  flipHint: { alignItems: 'center', gap: 5, position: 'absolute', bottom: 16 },
  grades: { gap: 10 },
  gradeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  doneIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
