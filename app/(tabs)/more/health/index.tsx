// app/(tabs)/more/health/index.tsx
// Health & Nutrition — full CRUD + customization. Real repo-backed metrics +
// meals (add / edit / delete), macro summary vs a transparent TDEE target (or a
// user calorie goal), unit-aware display (kg↔lb, ml↔oz), and AI meal-photo
// estimation with an honest fallback. Cards are a keyed config filtered by the
// user's hidden-cards preference. Non-prescriptive by design.
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
import { SectionCustomizeSheet } from '@/components/ui/SectionCustomizeSheet';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { bmr, tdee, targetCalories } from '@/services/nutrition';
import { estimateMeal } from '@/services/nutrition';
import { captureService } from '@/services/captureService';
import { intelligence, type Insight } from '@/services/intelligence';
import { Sparkline, trendOf } from '@/components/ui/Sparkline';
import { useSectionPref, kgToLb, lbToKg, mlToOz, ozToMl } from '@/store/sectionPrefs';
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
  const prefs = useSectionPref('health');
  const accent = prefs.accent || c.accent; // section accent recolors inner surfaces only
  const { data: health, reload: reloadHealth } = useAsync(() => repository.getHealthToday(), EMPTY_HEALTH);
  const { data: meals, reload: reloadMeals } = useAsync(() => repository.listMeals(), []);

  const [estimating, setEstimating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [waterBoost, setWaterBoost] = useState(0); // optimistic +water taps
  const { data: week } = useAsync(() => repository.listHealthWeek(), [], 'healthWeek');
  const [healthInsights, setHealthInsights] = useState<Insight[]>([]);
  const [sheet, setSheet] = useState<null | 'sleep' | 'steps' | 'weight' | 'water'>(null);
  const [mealSheet, setMealSheet] = useState<null | 'add' | Meal>(null);
  const [customize, setCustomize] = useState(false);

  React.useEffect(() => {
    intelligence.listInsights().then((ins) => setHealthInsights(ins.filter((i) => i.domain === 'health').slice(0, 2)));
  }, []);

  const isHidden = (k: string) => prefs.hiddenCards.includes(k);
  const wUnit = prefs.units.weight;
  const vUnit = prefs.units.volume;

  const waterNow = health.waterMl + waterBoost;
  const addWater = async () => {
    haptics.select();
    setWaterBoost((b) => b + 250);
    await repository.upsertHealthToday({ waterMl: waterNow + 250 });
  };
  const waterSeries = week.map((d) => d.waterMl);

  // Volume-aware water display.
  const fmtWater = (ml: number) => (vUnit === 'oz' ? `${Math.round(mlToOz(ml))}oz` : `${(ml / 1000).toFixed(1)}L`);

  const totals = meals.reduce(
    (a, m) => ({ cal: a.cal + m.calories, p: a.p + m.protein, cb: a.cb + m.carbs, f: a.f + m.fat }),
    { cal: 0, p: 0, cb: 0, f: 0 }
  );

  const weight = health.weightKg ?? 74;
  const height = health.heightCm ?? 178;
  const bmi = +(weight / Math.pow(height / 100, 2)).toFixed(1);
  const computedTarget = targetCalories(tdee(bmr(PROFILE.sex, weight, height, PROFILE.age), PROFILE.activity), PROFILE.goal);
  const target = prefs.goals.calorieTarget ?? computedTarget;
  const calPct = Math.min(100, Math.round((totals.cal / target) * 100));

  // Weight-aware display of the current weight.
  const weightDisp = wUnit === 'lb' ? kgToLb(weight) : weight;
  const fmtWeight = (kg: number) => `${(wUnit === 'lb' ? kgToLb(kg) : kg).toFixed(1)}${wUnit}`;

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
    await repository.addMeal(est);
    reloadMeals();
  };

  // Manual logging — the section is fully editable by hand, not photo-only.
  const sheetConfig: Record<'sleep' | 'steps' | 'weight' | 'water', { title: string; icon: any; fields: SheetField[] }> = {
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
      fields: [{ key: 'weight', label: t('health.weight'), suffix: wUnit, numeric: true, placeholder: wUnit === 'lb' ? '163' : '74', initial: health.weightKg ? weightDisp.toFixed(1) : '' }],
    },
    water: {
      title: t('health.log_water'),
      icon: 'water-outline',
      fields: [{ key: 'water', label: t('health.water'), suffix: vUnit, numeric: true, placeholder: vUnit === 'oz' ? '85' : '2500', initial: waterNow ? (vUnit === 'oz' ? Math.round(mlToOz(waterNow)).toString() : String(waterNow)) : '' }],
    },
  };

  const onSheetSubmit = async (v: Record<string, string>) => {
    const num = (s: string) => Math.max(0, Math.round(Number(s) || 0));
    if (sheet === 'sleep') {
      await repository.upsertHealthToday({ sleepMin: Math.round((Number(v.hours) || 0) * 60) });
    } else if (sheet === 'steps') {
      await repository.upsertHealthToday({ steps: num(v.steps) });
    } else if (sheet === 'weight') {
      const raw = Number(v.weight) || 0;
      await repository.upsertHealthToday({ weightKg: wUnit === 'lb' ? +lbToKg(raw).toFixed(1) : raw });
    } else if (sheet === 'water') {
      const raw = Number(v.water) || 0;
      const ml = vUnit === 'oz' ? Math.round(ozToMl(raw)) : Math.round(raw);
      setWaterBoost(0);
      await repository.upsertHealthToday({ waterMl: ml });
    }
    reloadHealth();
  };

  const mealFields: SheetField[] = [
    { key: 'name', label: t('health.meal_name'), placeholder: t('health.meal_name'), initial: typeof mealSheet === 'object' && mealSheet ? mealSheet.name : '' },
    { key: 'calories', label: t('health.calories_today'), suffix: 'kcal', numeric: true, placeholder: '450', initial: typeof mealSheet === 'object' && mealSheet ? String(mealSheet.calories) : '' },
    { key: 'protein', label: t('health.protein'), suffix: 'g', numeric: true, placeholder: '0', initial: typeof mealSheet === 'object' && mealSheet ? String(mealSheet.protein) : '' },
    { key: 'carbs', label: t('health.carbs'), suffix: 'g', numeric: true, placeholder: '0', initial: typeof mealSheet === 'object' && mealSheet ? String(mealSheet.carbs) : '' },
    { key: 'fat', label: t('health.fat'), suffix: 'g', numeric: true, placeholder: '0', initial: typeof mealSheet === 'object' && mealSheet ? String(mealSheet.fat) : '' },
  ];

  const onMealSubmit = async (v: Record<string, string>) => {
    const num = (s: string) => Math.max(0, Math.round(Number(s) || 0));
    const payload = {
      name: v.name?.trim() || t('health.add_meal'),
      calories: num(v.calories),
      protein: num(v.protein),
      carbs: num(v.carbs),
      fat: num(v.fat),
    };
    if (typeof mealSheet === 'object' && mealSheet) {
      await repository.updateMeal(mealSheet.id, payload);
    } else {
      await repository.addMeal({ ...payload, aiEstimated: false });
    }
    reloadMeals();
  };

  // ── Card config, filtered by the user's hidden-cards preference ──
  const cardNodes: { key: string; node: React.ReactNode }[] = [
    {
      key: 'summary',
      node: (
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
            <View style={[S.pFill, { width: `${calPct}%`, backgroundColor: accent }]} />
          </View>
          <View style={[S.macros, { flexDirection: rowDir }]}>
            <Macro label={t('health.protein')} val={`${totals.p}g`} c={c} />
            <Macro label={t('health.carbs')} val={`${totals.cb}g`} c={c} />
            <Macro label={t('health.fat')} val={`${totals.f}g`} c={c} />
          </View>
          <Text style={{ color: c.t4, fontSize: 11, marginTop: 10, textAlign }}>{t('health.disclaimer')}</Text>
        </SmartCard>
      ),
    },
    {
      key: 'metrics',
      node: (
        <View style={[S.metricRow, { flexDirection: rowDir }]}>
          <Pressable onPress={addWater} onLongPress={() => { haptics.select(); setSheet('water'); }} style={{ flex: 1 }}>
            <View style={[MS.metric, { backgroundColor: c.bg1, borderColor: accent + '44' }]}>
              <Ionicons name="water-outline" size={18} color={accent} />
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15 }}>{fmtWater(waterNow)}</Text>
              <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 3 }}>
                <Ionicons name="add" size={10} color={accent} />
                <Text style={{ color: accent, fontSize: 10, fontWeight: '700' }}>250ml</Text>
              </View>
            </View>
          </Pressable>
          <Metric icon="moon-outline" val={`${(health.sleepMin / 60).toFixed(1)}h`} label={t('health.sleep')} c={c} onPress={() => { haptics.select(); setSheet('sleep'); }} />
          <Metric icon="footsteps-outline" val={`${health.steps}`} label={t('health.steps')} c={c} onPress={() => { haptics.select(); setSheet('steps'); }} />
          <Metric icon="barbell-outline" val={fmtWeight(weight)} label={t('health.weight')} c={c} onPress={() => { haptics.select(); setSheet('weight'); }} />
        </View>
      ),
    },
    ...(waterSeries.length >= 3
      ? [{
          key: 'water_trend',
          node: (
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
              <Text style={{ color: c.t4, fontSize: 11, marginTop: 4, textAlign }}>{t('health.water_goal', { goal: fmtWater(prefs.goals.waterTargetMl) })}</Text>
              <View style={{ marginTop: 10, width: 150 }}>
                <Sparkline data={waterSeries} />
              </View>
            </SmartCard>
          ),
        }]
      : []),
    {
      key: 'meals',
      node: (
        <View style={{ gap: 14 }}>
          <Text style={[S.secTitle, { color: c.t2, textAlign }]}>{t('health.meals_today')}</Text>
          {meals.length === 0 && (
            <Text style={{ color: c.t4, fontSize: 13, textAlign, paddingHorizontal: 4, paddingVertical: 8 }}>
              {t('health.no_meals')}
            </Text>
          )}
          {meals.map((m) => (
            <Pressable key={m.id} onPress={() => { haptics.select(); setMealSheet(m); }}>
              <SmartCard padSize="sm">
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
                  <Ionicons name="pencil" size={13} color={c.t4} />
                </View>
              </SmartCard>
            </Pressable>
          ))}
        </View>
      ),
    },
  ];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={prefs.icon ? `${prefs.icon} ${t('sections.health')}` : t('sections.health')}
        right={[{ icon: 'options-outline', onPress: () => { haptics.select(); setCustomize(true); }, color: c.t2 }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {cardNodes.filter((cn) => !isHidden(cn.key)).map((cn) => (
          <React.Fragment key={cn.key}>{cn.node}</React.Fragment>
        ))}

        {/* In-section AI recommendations (non-prescriptive) — always shown */}
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
        <Pressable onPress={() => { haptics.select(); setMealSheet('add'); }}>
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

      {mealSheet && (
        <QuickLogSheet
          visible={!!mealSheet}
          title={typeof mealSheet === 'object' ? t('health.edit_meal') : t('health.add_meal')}
          icon="restaurant-outline"
          fields={mealFields}
          onClose={() => setMealSheet(null)}
          onSubmit={onMealSubmit}
          onDelete={typeof mealSheet === 'object' && mealSheet ? async () => { await repository.deleteMeal(mealSheet.id); reloadMeals(); } : undefined}
        />
      )}

      {customize && (
        <SectionCustomizeSheet
          visible={customize}
          section="health"
          title={t('customize.health_title')}
          iconEnabled
          accentEnabled
          goalFields={[
            { key: 'calorieTarget', label: t('health.goal_calories'), suffix: 'kcal' },
            { key: 'waterTargetMl', label: t('health.goal_water'), suffix: 'ml' },
          ]}
          unitToggles={[
            { key: 'weight', label: t('health.unit_weight'), options: [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }] },
            { key: 'volume', label: t('health.unit_volume'), options: [{ value: 'ml', label: 'ml' }, { value: 'oz', label: 'oz' }] },
          ]}
          cards={[
            { key: 'summary', label: t('health.card_summary') },
            { key: 'metrics', label: t('health.card_metrics') },
            { key: 'water_trend', label: t('health.water_week') },
            { key: 'meals', label: t('health.meals_today') },
          ]}
          reminderTitle={t('health.reminder_title')}
          onClose={() => setCustomize(false)}
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
