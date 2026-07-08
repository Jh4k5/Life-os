// app/(tabs)/more/exercise/index.tsx
// Exercise — full CRUD + customization. Repo-backed workout history with a real
// editor: name, gym/home mode, duration, and a dynamic list of exercises the
// user adds/removes. Tap a workout to edit, delete from the editor. Stats/mode
// cards are a keyed config filtered by the user's hidden-cards preference.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { useHaptics } from '@/hooks/useHaptics';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCustomizeSheet } from '@/components/ui/SectionCustomizeSheet';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';
import { useSectionPref } from '@/store/sectionPrefs';
import { feedback } from '@/services/feedback';
import type { Workout, WorkoutExercise } from '@/services/types';

export default function ExerciseScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const haptics = useHaptics();
  const prefs = useSectionPref('exercise');
  const [mode, setMode] = useState<'all' | 'gym' | 'home'>('all');
  const { data: workouts, reload } = useAsync(() => repository.listWorkouts(), [], 'workouts');
  const [editor, setEditor] = useState<null | 'new' | Workout>(null);
  const [customize, setCustomize] = useState(false);

  const isHidden = (k: string) => prefs.hiddenCards.includes(k);
  const filtered = workouts.filter((w) => mode === 'all' || w.mode === mode);
  const weekMinutes = workouts.reduce((s, w) => s + w.durationMin, 0);
  const weekSets = workouts.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.sets, 0), 0);

  const cardNodes: { key: string; node: React.ReactNode }[] = [
    {
      key: 'stats',
      node: (
        <SmartCard>
          <View style={[S.stats, { flexDirection: rowDir }]}>
            <Stat icon="time-outline" val={`${weekMinutes}m`} label={t('exercise.this_week')} c={c} />
            <View style={[S.divider, { backgroundColor: c.b1 }]} />
            <Stat icon="layers-outline" val={weekSets} label={t('exercise.sets')} c={c} />
            <View style={[S.divider, { backgroundColor: c.b1 }]} />
            <Stat icon="flame-outline" val={workouts.length} label={t('exercise.workouts')} c={c} />
          </View>
        </SmartCard>
      ),
    },
    {
      key: 'modes',
      node: (
        <View style={[S.modeRow, { flexDirection: rowDir }]}>
          {(['all', 'gym', 'home'] as const).map((m) => {
            const on = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[S.modeChip, { backgroundColor: on ? c.accent : c.bg2, borderColor: on ? c.accent : c.b1 }]}
              >
                <Text style={{ color: on ? '#FFF' : c.t2, fontWeight: '600', fontSize: 13 }}>
                  {t(`exercise.mode_${m}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ),
    },
  ];

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={prefs.icon ? `${prefs.icon} ${t('sections.exercise')}` : t('sections.exercise')}
        right={[
          { icon: 'options-outline', onPress: () => { haptics.select(); setCustomize(true); }, color: c.t2 },
          { icon: 'add', onPress: () => { haptics.select(); setEditor('new'); }, color: c.accent },
        ]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {cardNodes.filter((cn) => !isHidden(cn.key)).map((cn) => (
              <React.Fragment key={cn.key}>{cn.node}</React.Fragment>
            ))}
          </View>
        }
        renderItem={({ item: w }) => (
          <Pressable onPress={() => { haptics.select(); setEditor(w); }}>
            <SmartCard>
              <View style={[S.head, { flexDirection: rowDir }]}>
                <View style={[S.icon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name={w.mode === 'gym' ? 'barbell-outline' : 'home-outline'} size={20} color={c.t1} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 15, fontWeight: '700', textAlign }} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={{ color: c.t3, fontSize: 12, textAlign, marginTop: 2 }}>
                    {w.durationMin} {t('exercise.min')} · {w.exercises.length} {t('exercise.exercises')}
                  </Text>
                </View>
                <View style={[S.modeTag, { backgroundColor: c.bg3 }]}>
                  <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>{t(`exercise.mode_${w.mode}`)}</Text>
                </View>
                <Ionicons name="pencil" size={13} color={c.t4} />
              </View>
              {w.exercises.map((e, i) => (
                <View key={i} style={[S.exRow, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                  <Ionicons name="ellipse" size={6} color={c.accent} />
                  <Text style={{ color: c.t1, flex: 1, fontSize: 13, textAlign }} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text style={{ color: c.t3, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                    {e.sets}×{e.reps}
                    {e.weight ? ` · ${e.weight}kg` : ''}
                  </Text>
                </View>
              ))}
            </SmartCard>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="barbell-outline" title={t('exercise.empty')} />}
      />

      {editor && (
        <WorkoutEditor
          workout={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={async (payload) => {
            if (editor === 'new') await repository.addWorkout(payload);
            else await repository.updateWorkout(editor.id, payload);
            reload();
          }}
          onDelete={editor === 'new' ? undefined : async () => { await repository.deleteWorkout(editor.id); reload(); }}
        />
      )}

      {customize && (
        <SectionCustomizeSheet
          visible={customize}
          section="exercise"
          title={t('customize.exercise_title')}
          iconEnabled
          goalFields={[]}
          unitToggles={[]}
          cards={[
            { key: 'stats', label: t('exercise.card_stats') },
            { key: 'modes', label: t('exercise.card_modes') },
          ]}
          reminderTitle={t('exercise.reminder_title')}
          onClose={() => setCustomize(false)}
        />
      )}
    </View>
  );
}

// ── Workout editor: name, mode, duration, and a dynamic exercise list ──
interface EditorPayload {
  name: string;
  mode: 'gym' | 'home';
  durationMin: number;
  exercises: WorkoutExercise[];
}

const WorkoutEditor = ({
  workout,
  onClose,
  onSave,
  onDelete,
}: {
  workout: Workout | null;
  onClose: () => void;
  onSave: (payload: EditorPayload) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();

  const [name, setName] = useState(workout?.name ?? '');
  const [mode, setMode] = useState<'gym' | 'home'>(workout?.mode ?? 'gym');
  const [duration, setDuration] = useState(workout ? String(workout.durationMin) : '');
  const [exercises, setExercises] = useState<{ name: string; sets: string; reps: string; weight: string }[]>(
    workout?.exercises.map((e) => ({ name: e.name, sets: String(e.sets), reps: String(e.reps), weight: e.weight ? String(e.weight) : '' })) ?? []
  );

  const addExercise = () => { feedback.tap(); setExercises((x) => [...x, { name: '', sets: '', reps: '', weight: '' }]); };
  const removeExercise = (i: number) => { feedback.warning(); setExercises((x) => x.filter((_, k) => k !== i)); };
  const setEx = (i: number, key: 'name' | 'sets' | 'reps' | 'weight', v: string) =>
    setExercises((x) => x.map((e, k) => (k === i ? { ...e, [key]: v } : e)));

  const canSave = name.trim().length > 0;
  const save = () => {
    if (!canSave) return;
    feedback.success();
    const num = (s: string) => Math.max(0, Math.round(Number(s) || 0));
    const cleaned: WorkoutExercise[] = exercises
      .filter((e) => e.name.trim().length > 0)
      .map((e) => {
        const w = num(e.weight);
        return { name: e.name.trim(), sets: num(e.sets), reps: num(e.reps), ...(w > 0 ? { weight: w } : {}) };
      });
    onSave({ name: name.trim(), mode, durationMin: num(duration), exercises: cleaned });
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ES.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 24 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ES.center}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={[ES.panel, { backgroundColor: c.glass, borderColor: 'rgba(255,255,255,0.14)' }]}
            >
              <View style={[ES.header, { flexDirection: rowDir }]}>
                <View style={[ES.iconWrap, { backgroundColor: c.accent + '22' }]}>
                  <Ionicons name="barbell-outline" size={18} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 17, fontWeight: '800', textAlign }}>
                  {workout ? t('exercise.edit_workout') : t('exercise.new_workout')}
                </Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={c.t3} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
                {/* Name */}
                <Text style={[ES.label, { color: c.t3, textAlign }]}>{t('exercise.workout_name')}</Text>
                <View style={[ES.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('exercise.workout_name')}
                    placeholderTextColor={c.t4}
                    style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }}
                  />
                </View>

                {/* Mode */}
                <Text style={[ES.label, { color: c.t3, textAlign, marginTop: 14 }]}>{t('exercise.mode')}</Text>
                <View style={[ES.segment, { flexDirection: rowDir, backgroundColor: c.bg3, borderColor: c.b1 }]}>
                  {(['gym', 'home'] as const).map((m) => {
                    const on = mode === m;
                    return (
                      <Pressable key={m} onPress={() => { feedback.select(); setMode(m); }} style={[ES.segBtn, { backgroundColor: on ? c.accent : 'transparent' }]}>
                        <Text style={{ color: on ? '#FFF' : c.t2, fontSize: 13, fontWeight: '700' }}>{t(`exercise.mode_${m}`)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Duration */}
                <Text style={[ES.label, { color: c.t3, textAlign, marginTop: 14 }]}>{t('exercise.duration')}</Text>
                <View style={[ES.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                  <TextInput
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="45"
                    placeholderTextColor={c.t4}
                    keyboardType="numeric"
                    style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }}
                  />
                  <Text style={{ color: c.t3, fontSize: 13, fontWeight: '600' }}>{t('exercise.min')}</Text>
                </View>

                {/* Exercises */}
                <View style={[{ alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }, { flexDirection: rowDir }]}>
                  <Text style={[ES.label, { color: c.t3, textAlign }]}>{t('exercise.exercises')}</Text>
                  <Pressable onPress={addExercise} style={[ES.addChip, { backgroundColor: c.accentDim, flexDirection: rowDir }]}>
                    <Ionicons name="add" size={14} color={c.accent} />
                    <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('exercise.add_exercise')}</Text>
                  </Pressable>
                </View>

                {exercises.map((e, i) => (
                  <View key={i} style={[ES.exBlock, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
                    <View style={[{ alignItems: 'center', gap: 8 }, { flexDirection: rowDir }]}>
                      <TextInput
                        value={e.name}
                        onChangeText={(v) => setEx(i, 'name', v)}
                        placeholder={t('exercise.exercise_name')}
                        placeholderTextColor={c.t4}
                        style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign, padding: 0 }}
                      />
                      <Pressable onPress={() => removeExercise(i)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={c.t3} />
                      </Pressable>
                    </View>
                    <View style={[{ gap: 8, marginTop: 8 }, { flexDirection: rowDir }]}>
                      <MiniField value={e.sets} onChangeText={(v: string) => setEx(i, 'sets', v)} placeholder={t('exercise.sets')} c={c} textAlign={textAlign} />
                      <MiniField value={e.reps} onChangeText={(v: string) => setEx(i, 'reps', v)} placeholder={t('exercise.reps')} c={c} textAlign={textAlign} />
                      <MiniField value={e.weight} onChangeText={(v: string) => setEx(i, 'weight', v)} placeholder={t('exercise.weight_kg')} c={c} textAlign={textAlign} />
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable onPress={save} disabled={!canSave} style={[ES.submit, { backgroundColor: canSave ? c.accent : c.b2, opacity: canSave ? 1 : 0.6 }]}>
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{t('common.save')}</Text>
              </Pressable>
              {onDelete ? (
                <Pressable onPress={() => { feedback.warning(); onDelete(); onClose(); }} style={ES.deleteBtn}>
                  <Ionicons name="trash-outline" size={15} color={c.red} />
                  <Text style={{ color: c.red, fontSize: 14, fontWeight: '700' }}>{t('exercise.delete_workout')}</Text>
                </Pressable>
              ) : null}
            </BlurView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const MiniField = ({ value, onChangeText, placeholder, c, textAlign }: any) => (
  <View style={[ES.mini, { backgroundColor: c.bg3, borderColor: c.b1 }]}>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.t4}
      keyboardType="numeric"
      style={{ color: c.t1, fontSize: 13, fontWeight: '600', textAlign, padding: 0 }}
    />
  </View>
);

const Stat = ({ icon, val, label, c }: any) => (
  <View style={{ alignItems: 'center', flex: 1, gap: 4 }}>
    <Ionicons name={icon} size={18} color={c.t2} />
    <Text style={{ color: c.t1, fontWeight: '800', fontSize: 18 }}>{val}</Text>
    <Text style={{ color: c.t3, fontSize: 11 }} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  stats: { alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 6 },
  modeRow: { gap: 8 },
  modeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  head: { alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  exRow: { alignItems: 'center', gap: 8, paddingVertical: 9, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
});

const ES = StyleSheet.create({
  backdrop: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  panel: { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden' },
  header: { alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
  inputRow: { alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 50, marginTop: 6 },
  segment: { borderWidth: 1, borderRadius: 12, padding: 3, gap: 3, marginTop: 6 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9 },
  addChip: { alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  exBlock: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10 },
  mini: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 42, justifyContent: 'center' },
  submit: { marginTop: 16, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { marginTop: 10, height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
