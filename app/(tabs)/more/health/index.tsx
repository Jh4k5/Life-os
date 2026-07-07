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
import { QuickLogSheet, type SheetField } from '@/components/ui/QuickLogSheet';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { bmr, tdee, targetCalories } from '@/services/nutrition';
import { estimateMeal } from '@/services/nutrition';
import { captureService } from '@/services/captureService';
import { intelligence, type Insight } from '@/services/intelligence';
import { Sparkline, trendOf } from '@/components/ui/Sparkline';
import type { Meal, HealthDay } from '@/services/types';

// Zero-state default until the real day loads (repository is source of truth).
const EMPTY_HEALTH: HealthDay = { day: '', weightKg: null, heightCm: null, waterMl: 0, sleepMin: 0, steps: 0 };

// A default profile until the user sets theirs (Settings → Profile, later).
const PROFILE = { sex: 'male' as const, age: 25, activity: 'moderate' as const, goal: 'maintain' as const };

export default function HealthScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const haptics = useHaptics();
  const { data: health, reload: reloadHealth } = useAsync(() => repository.getHealthToday(), EMPTY_HEALTH);
  const { data: loadedMeals, reload: reloadMeals } = useAsync(() => repository.listMeals(), []);

  const [extra, setExtra] = useState<Meal[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [waterBoost, setWaterBoost] = useState(0); // optimistic +water taps
  const { data: week } = useAsync(() => repository.listHealthWeek(), [], 'healthWeek');
  const [healthInsights, setHealthInsights] = useState<Insight[]>([]);
  const [sheet, setSheet] = useState<null | 'sleep' | 'steps' | 'weight' | 'meal'>(null);

  React.useEffect(() => {
    intelligence.listInsights().then((ins) => setHealthInsights(ins.filter((i) => i.domain === 'health').slice(0, 2)));
  }, []);

  const waterNow = health.waterMl + waterBoost;
  const addWater = async () => {
    haptics.select();
    setWaterBoost((b) => b + 250);
    await repository.upsertHealthToday({ waterMl: waterNow + 250 });
  };
  const waterSeries = week.map((d) => d.waterMl);

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
    const img = await captureService.captureImage();
    if (!img) return;
    setEstimating(true);
    const est = await estimateMeal({ uri: img.uri, base64: img.base64, mimeType: img.mimeType });
    setEstimating(false);
    if (!est) {
      setNote(t('health.estimate_offline'));
      return;
    }
    const saved = await repository.addMeal(est);
    setExtra((p) => [...p, saved]);
  };

  // Manual logging — the section is fully editable by hand, not photo-only.
  const sheetConfig: Record<'sleep' | 'steps' | 'weight' | 'meal', { title: string; icon: any; fields: SheetField[] }> = {
    sleep: {
      title: t('health.log_sleep'),
      icon: 'moon-outline',
      fields: [{ key: 'hours', label: t('health.sleep'), suffix: 'h', numeric: true, placeholder: '7.5', initial: health.sleepMin ? (health.sleepMin / 60).toString() : '' }],
    },
    steps: {
      title: t('health.log_steps'),
      icon: 'footsteps-outline',
      fields: [{ key: 'steps', label: t('health.steps'), numeric: true, placeholder: '8000', initial: health.steps ? String(health.steps) : '' }],
    },
    weight: {
      title: t('health.log_weight'),
      icon: 'barbell-outline',
      fields: [{ key: 'weight', label: t('health.weight'), suffix: 'kg', numeric: true, placeholder: '74', initial: health.weightKg ? String(health.weightKg) : '' }],
    },
    meal: {
      title: t('health.add_meal'),
      icon: 'restaurant-outline',
      fields: [
        { key: 'name', label: t('health.meal_name'), placeholder: t('health.meal_name') },
        { key: 'calories', label: t('health.calories_today'), suffix: 'kcal', numeric: true, placeholder: '450' },
        { key: 'protein', label: t('health.protein'), suffix: 'g', numeric: true, placeholder: '0' },
        { key: 'carbs', label: t('health.carbs'), suffix: 'g', numeric: true, placeholder: '0' },
        { key: 'fat', label: t('health.fat'), suffix: 'g', numeric: true, placeholder: '0' },
      ],
    },
  };

  const onSheetSubmit = async (v: Record<string, string>) => {
    const num = (s: string) => Math.max(0, Math.round(Number(s) || 0));
    if (sheet === 'sleep') {
      await repository.upsertHealthToday({ sleepMin: Math.round((Number(v.hours) || 0) * 60) });
      reloadHealth();
    } else if (sheet === 'steps') {
      await repository.upsertHealthToday({ steps: num(v.steps) });
      reloadHealth();
    } else if (sheet === 'weight') {
      await repository.upsertHealthToday({ weightKg: Number(v.weight) || 0 });
      reloadHealth();
    } else if (sheet === 'meal') {
      await repository.addMeal({
        name: v.name?.trim() || t('health.add_meal'),
        calories: num(v.calories),
        protein: num(v.protein),
        carbs: num(v.carbs),
        fat: num(v.fat),
        aiEstimated: false,
      });
      reloadMeals();
    }
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

        {/* Today metrics — water is one-tap loggable */}
        <View style={[S.metricRow, { flexDirection: rowDir }]}>
          <Pressable onPress={addWater} style={{ flex: 1 }}>
            <View style={[MS.metric, { backgroundColor: c.bg1, borderColor: c.accent + '44' }]}>
              <Ionicons name="water-outline" size={18} color={c.accent} />
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15 }}>{(waterNow / 1000).toFixed(1)}L</Text>
              <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 3 }}>
                <Ionicons name="add" size={10} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 10, fontWeight: '700' }}>250ml</Text>
              </View>
            </View>
          </Pressable>
          <Metric icon="moon-outline" val={`${(health.sleepMin / 60).toFixed(1)}h`} label={t('health.sleep')} c={c} onPress={() => { haptics.select(); setSheet('sleep'); }} />
          <Metric icon="footsteps-outline" val={`${health.steps}`} label={t('health.steps')} c={c} onPress={() => { haptics.select(); setSheet('steps'); }} />
          <Metric icon="barbell-outline" val={`${weight}kg`} label={t('health.weight')} c={c} onPress={() => { haptics.select(); setSheet('weight'); }} />
        </View>

        {/* Weekly water trend (single series; direction as icon+text) */}
        {waterSeries.length >= 3 && (
          <SmartCard padSize="sm">
            <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 8 }}>
              <Text style={{ color: c.t3, fontSize: 12, fontWeight: '700', flex: 1, textAlign }}>{t('health.water_week')}</Text>
              <Ionicons
                name={trendOf(waterSeries) === 'up' ? 'arrow-up-outline' : trendOf(waterSeries) === 'down' ? 'arrow-down-outline' : 'remove-outline'}
                size={13}
                color={c.t2}
              />
              <Text style={{ color: c.t2, fontSize: 12, fontWeight: '600' }}>{t(`dash.trend_${trendOf(waterSeries)}`)}</Text>
            </View>
            <View style={{ marginTop: 10, width: 150 }}>
              <Sparkline data={waterSeries} />
            </View>
          </SmartCard>
        )}

        {/* In-section AI recommendations (non-prescriptive) */}
        {healthInsights.map((ins) => (
          <View key={ins.id} style={[S.insRow, { flexDirection: rowDir, backgroundColor: c.bg1, borderColor: c.b1 }]}>
            <Ionicons name="sparkles-outline" size={15} color={c.accent} />
            <Text style={{ flex: 1, color: c.t2, fontSize: 13, lineHeight: 19, textAlign }}>{ins.title}</Text>
          </View>
        ))}

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

        {/* Log meal manually (no photo needed) */}
        <Pressable onPress={() => { haptics.select(); setSheet('meal'); }}>
          <SmartCard padSize="sm">
            <View style={[S.logRow, { flexDirection: rowDir }]}>
              <View style={[S.logIcon, { backgroundColor: c.bg3 }]}>
                <Ionicons name="create-outline" size={18} color={c.t2} />
              </View>
              <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>
                {t('health.add_meal')}
              </Text>
              <Ionicons name="add-circle-outline" size={18} color={c.t3} />
            </View>
          </SmartCard>
        </Pressable>

        {/* Meals */}
        <Text style={[S.secTitle, { color: c.t2, textAlign }]}>{t('health.meals_today')}</Text>
        {meals.length === 0 && (
          <Text style={{ color: c.t4, fontSize: 13, textAlign, paddingHorizontal: 4, paddingVertical: 8 }}>
            {t('health.no_meals')}
          </Text>
        )}
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

      {sheet && (
        <QuickLogSheet
          visible={!!sheet}
          title={sheetConfig[sheet].title}
          icon={sheetConfig[sheet].icon}
          fields={sheetConfig[sheet].fields}
          onClose={() => setSheet(null)}
          onSubmit={onSheetSubmit}
        />
      )}
    </View>
  );
}

const Macro = ({ label, val, c }: any) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 16 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }}>{label}</Text>
  </View>
);

const Metric = ({ icon, val, label, c, onPress }: any) => (
  <Pressable onPress={onPress} style={{ flex: 1 }}>
    <View style={[MS.metric, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
      <Ionicons name={icon} size={18} color={c.t2} />
      <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15 }}>{val}</Text>
      <Text style={{ color: c.t3, fontSize: 10 }} numberOfLines={1}>
        {label}
      </Text>
      {onPress ? (
        <View style={MS.editDot}>
          <Ionicons name="pencil" size={8} color={c.t3} />
        </View>
      ) : null}
    </View>
  </Pressable>
);

const MS = StyleSheet.create({
  metric: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  editDot: { position: 'absolute', top: 6, insetInlineEnd: 6, opacity: 0.6 },
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
  insRow: { alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  mealIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiTag: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
