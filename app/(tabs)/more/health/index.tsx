// app/(tabs)/more/health/index.tsx
// Health & Nutrition — v3 premium. Real repo-backed metrics + meals, macro
// summary vs a transparent TDEE target, and AI meal-photo estimation (with an
// honest fallback when the server isn't reachable). Non-prescriptive by design.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { useHaptics } from '@/hooks/useHaptics';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { mockHealthToday, mockMeals } from '@/data/mock';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { bmr, tdee, targetCalories } from '@/services/nutrition';
import { estimateMeal } from '@/services/nutrition';
import { captureService } from '@/services/captureService';
import type { Meal } from '@/services/types';

// A default profile until the user sets theirs (Settings → Profile, later).
const PROFILE = { sex: 'male' as const, age: 25, activity: 'moderate' as const, goal: 'maintain' as const };

export default function HealthScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const haptics = useHaptics();
  const { data: health } = useAsync(() => repository.getHealthToday(), mockHealthToday);
  const { data: loadedMeals } = useAsync(() => repository.listMeals(), mockMeals);

  const [extra, setExtra] = useState<Meal[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const meals = [...loadedMeals, ...extra];
  const totals = meals.reduce(
    (a, m) => ({ cal: a.cal + m.calories, p: a.p + m.protein, cb: a.cb + m.carbs, f: a.f + m.fat }),
    { cal: 0, p: 0, cb: 0, f: 0 }
  );

  const weight = health.weightKg ?? 74;
  const height = health.heightCm ?? 178;
  const bmi = +(weight / Math.pow(height / 100, 2)).toFixed(1);
  const target = targetCalories(tdee(bmr(PROFILE.sex, weight, height, PROFILE.age), PROFILE.activity), PROFILE.goal);
  const calPct = Math.min(100, Math.round((totals.cal / target) * 100));

  const logMealPhoto = async () => {
    haptics.select();
    setNote(null);
    const img = await captureService.pickImage();
    if (!img) return;
    setEstimating(true);
    const est = await estimateMeal({ uri: img.uri });
    setEstimating(false);
    if (!est) {
      setNote(t('health.estimate_offline'));
      return;
    }
    const saved = await repository.addMeal(est);
    setExtra((p) => [...p, saved]);
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('sections.health')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Energy / macros summary */}
        <SmartCard>
          <View style={[S.calHead, { flexDirection: rowDir }]}>
            <View>
              <Text style={{ color: c.t3, fontSize: 12, textAlign }}>{t('health.calories_today')}</Text>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 28, textAlign }}>
                {totals.cal}
                <Text style={{ color: c.t3, fontSize: 15, fontWeight: '600' }}> / {target}</Text>
              </Text>
            </View>
            <View style={[S.bmiPill, { backgroundColor: c.bg3 }]}>
              <Text style={{ color: c.t3, fontSize: 11 }}>BMI</Text>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 16 }}>{bmi}</Text>
            </View>
          </View>
          <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 12 }]}>
            <View style={[S.pFill, { width: `${calPct}%`, backgroundColor: c.accent }]} />
          </View>
          <View style={[S.macros, { flexDirection: rowDir }]}>
            <Macro label={t('health.protein')} val={`${totals.p}g`} c={c} />
            <Macro label={t('health.carbs')} val={`${totals.cb}g`} c={c} />
            <Macro label={t('health.fat')} val={`${totals.f}g`} c={c} />
          </View>
          <Text style={{ color: c.t4, fontSize: 11, marginTop: 10, textAlign }}>{t('health.disclaimer')}</Text>
        </SmartCard>

        {/* Today metrics */}
        <View style={[S.metricRow, { flexDirection: rowDir }]}>
          <Metric icon="water-outline" val={`${(health.waterMl / 1000).toFixed(1)}L`} label={t('health.water')} c={c} />
          <Metric icon="moon-outline" val={`${Math.round(health.sleepMin / 60)}h`} label={t('health.sleep')} c={c} />
          <Metric icon="footsteps-outline" val={`${health.steps}`} label={t('health.steps')} c={c} />
          <Metric icon="barbell-outline" val={`${weight}kg`} label={t('health.weight')} c={c} />
        </View>

        {/* Log meal via photo */}
        <Pressable onPress={logMealPhoto} disabled={estimating}>
          <SmartCard padSize="sm">
            <View style={[S.logRow, { flexDirection: rowDir }]}>
              <View style={[S.logIcon, { backgroundColor: c.accentDim }]}>
                {estimating ? (
                  <ActivityIndicator size="small" color={c.accent} />
                ) : (
                  <Ionicons name="camera-outline" size={18} color={c.accent} />
                )}
              </View>
              <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>
                {t('health.log_meal_photo')}
              </Text>
              <Ionicons name="sparkles-outline" size={16} color={c.accent} />
            </View>
          </SmartCard>
        </Pressable>
        {note && (
          <Text style={{ color: c.orange, fontSize: 12, textAlign, paddingHorizontal: 4 }}>{note}</Text>
        )}

        {/* Meals */}
        <Text style={[S.secTitle, { color: c.t2, textAlign }]}>{t('health.meals_today')}</Text>
        {meals.map((m) => (
          <SmartCard key={m.id} padSize="sm">
            <View style={[S.mealRow, { flexDirection: rowDir }]}>
              <View style={[S.mealIcon, { backgroundColor: c.bg3 }]}>
                <Ionicons name="restaurant-outline" size={16} color={c.t2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }} numberOfLines={1}>
                    {m.name}
                  </Text>
                  {m.aiEstimated && (
                    <View style={[S.aiTag, { backgroundColor: c.accentDim }]}>
                      <Ionicons name="sparkles" size={9} color={c.accent} />
                    </View>
                  )}
                </View>
                <Text style={{ color: c.t3, fontSize: 12, textAlign, marginTop: 2 }}>
                  {m.protein}p · {m.carbs}c · {m.fat}f
                </Text>
              </View>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }}>{m.calories}</Text>
            </View>
          </SmartCard>
        ))}
      </ScrollView>
    </View>
  );
}

const Macro = ({ label, val, c }: any) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 16 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }}>{label}</Text>
  </View>
);

const Metric = ({ icon, val, label, c }: any) => (
  <View style={[MS.metric, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
    <Ionicons name={icon} size={18} color={c.t2} />
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 10 }} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const MS = StyleSheet.create({
  metric: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
});

const S = StyleSheet.create({
  screen: { flex: 1 },
  calHead: { justifyContent: 'space-between', alignItems: 'flex-start' },
  bmiPill: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, gap: 2 },
  pBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  pFill: { height: 8, borderRadius: 4 },
  macros: { marginTop: 14 },
  metricRow: { gap: 8 },
  secTitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  logRow: { alignItems: 'center', gap: 12 },
  logIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealRow: { alignItems: 'center', gap: 12 },
  mealIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiTag: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
