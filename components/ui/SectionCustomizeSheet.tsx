// components/ui/SectionCustomizeSheet.tsx
// A shared glass sheet that edits one section's customization: goals, units, a
// daily reminder time, and which cards are visible. Reads/writes the persisted
// store/sectionPrefs so every choice survives a full app restart. Opened from
// each section Header's options button. Non-prescriptive by design.
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { feedback } from '@/services/feedback';
import { notifications } from '@/services/notifications';
import {
  useSectionPrefs,
  nextAtTime,
  type Section,
  type SectionPrefs,
} from '@/store/sectionPrefs';

export interface GoalField {
  key: keyof SectionPrefs['goals'];
  label: string;
  suffix?: string;
}
export interface UnitToggle {
  key: keyof SectionPrefs['units'];
  label: string;
  options: { value: string; label: string }[];
}
export interface CardOption {
  key: string;
  label: string;
}

interface Props {
  visible: boolean;
  section: Section;
  title: string;
  goalFields: GoalField[];
  unitToggles: UnitToggle[];
  cards: CardOption[];
  reminderTitle: string; // notification title when the reminder fires
  onClose: () => void;
  onSaved?: () => void;
}

export const SectionCustomizeSheet = ({
  visible,
  section,
  title,
  goalFields,
  unitToggles,
  cards,
  reminderTitle,
  onClose,
  onSaved,
}: Props) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const prefs = useSectionPrefs((s) => s[section]);
  const setGoals = useSectionPrefs((s) => s.setGoals);
  const setUnits = useSectionPrefs((s) => s.setUnits);
  const setReminderTime = useSectionPrefs((s) => s.setReminderTime);
  const setHiddenCards = useSectionPrefs((s) => s.setHiddenCards);

  const [goals, setLocalGoals] = useState<Record<string, string>>({});
  const [units, setLocalUnits] = useState<SectionPrefs['units']>(prefs.units);
  const [reminder, setReminder] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);

  // Seed from the persisted prefs whenever the sheet (re)opens.
  useEffect(() => {
    if (!visible) return;
    const g: Record<string, string> = {};
    goalFields.forEach((f) => {
      const v = prefs.goals[f.key];
      g[f.key] = v == null ? '' : String(v);
    });
    setLocalGoals(g);
    setLocalUnits(prefs.units);
    setReminder(prefs.reminderTime);
    setHidden(prefs.hiddenCards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const save = async () => {
    feedback.success();
    const goalPatch: Partial<SectionPrefs['goals']> = {};
    goalFields.forEach((f) => {
      const raw = (goals[f.key] ?? '').trim();
      if (raw === '') {
        // calorieTarget clears to null (fall back to computed); others keep prior.
        if (f.key === 'calorieTarget') goalPatch.calorieTarget = null;
        return;
      }
      const n = Math.max(0, Math.round(Number(raw) || 0));
      (goalPatch as Record<string, number>)[f.key] = n;
    });
    setGoals(section, goalPatch);
    setUnits(section, units);
    setReminderTime(section, reminder.trim());
    setHiddenCards(section, hidden);

    // A set reminder time schedules a real local reminder (gated by the app's
    // Notifications toggle inside notifications.ts). No fake success.
    const at = nextAtTime(reminder);
    if (at) {
      await notifications.scheduleReminder(reminderTitle, t('customize.reminder_body'), at).catch(() => {});
    }
    onSaved?.();
    onClose();
  };

  const toggleHidden = (key: string) =>
    setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 24 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.center}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={[S.panel, { backgroundColor: c.glass, borderColor: 'rgba(255,255,255,0.14)' }]}
            >
              <View style={[S.header, { flexDirection: rowDir }]}>
                <View style={[S.iconWrap, { backgroundColor: c.accent + '22' }]}>
                  <Ionicons name="options-outline" size={18} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 17, fontWeight: '800', textAlign }}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={c.t3} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
                {/* Goals */}
                {goalFields.length > 0 && (
                  <Text style={[S.section, { color: c.t3, textAlign }]}>{t('customize.goals')}</Text>
                )}
                {goalFields.map((f) => (
                  <View key={f.key} style={{ gap: 6, marginTop: 10 }}>
                    <Text style={{ color: c.t3, fontSize: 12, fontWeight: '600', textAlign }}>{f.label}</Text>
                    <View style={[S.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                      <TextInput
                        value={goals[f.key] ?? ''}
                        onChangeText={(v) => setLocalGoals((s) => ({ ...s, [f.key]: v }))}
                        placeholder="—"
                        placeholderTextColor={c.t4}
                        keyboardType="numeric"
                        style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }}
                      />
                      {f.suffix ? <Text style={{ color: c.t3, fontSize: 13, fontWeight: '600' }}>{f.suffix}</Text> : null}
                    </View>
                  </View>
                ))}

                {/* Units */}
                {unitToggles.length > 0 && (
                  <Text style={[S.section, { color: c.t3, textAlign, marginTop: 18 }]}>{t('customize.units')}</Text>
                )}
                {unitToggles.map((u) => (
                  <View key={u.key} style={{ gap: 6, marginTop: 10 }}>
                    <Text style={{ color: c.t3, fontSize: 12, fontWeight: '600', textAlign }}>{u.label}</Text>
                    <View style={[S.segment, { flexDirection: rowDir, backgroundColor: c.bg3, borderColor: c.b1 }]}>
                      {u.options.map((opt) => {
                        const on = units[u.key] === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() => { feedback.select(); setLocalUnits((s) => ({ ...s, [u.key]: opt.value as never })); }}
                            style={[S.segBtn, { backgroundColor: on ? c.accent : 'transparent' }]}
                          >
                            <Text style={{ color: on ? '#FFF' : c.t2, fontSize: 13, fontWeight: '700' }}>{opt.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Reminder */}
                <Text style={[S.section, { color: c.t3, textAlign, marginTop: 18 }]}>{t('customize.reminder')}</Text>
                <View style={{ gap: 6, marginTop: 10 }}>
                  <Text style={{ color: c.t3, fontSize: 12, fontWeight: '600', textAlign }}>{t('customize.reminder_time')}</Text>
                  <View style={[S.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                    <TextInput
                      value={reminder}
                      onChangeText={setReminder}
                      placeholder={t('customize.time_ph')}
                      placeholderTextColor={c.t4}
                      style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }}
                    />
                    <Ionicons name="notifications-outline" size={16} color={c.t3} />
                  </View>
                </View>

                {/* Visible cards */}
                {cards.length > 0 && (
                  <Text style={[S.section, { color: c.t3, textAlign, marginTop: 18 }]}>{t('customize.visible_cards')}</Text>
                )}
                {cards.map((card) => {
                  const shown = !hidden.includes(card.key);
                  return (
                    <Pressable
                      key={card.key}
                      onPress={() => { feedback.select(); toggleHidden(card.key); }}
                      style={[S.cardRow, { flexDirection: rowDir }]}
                    >
                      <View style={[S.check, { backgroundColor: shown ? c.accent : 'transparent', borderColor: shown ? c.accent : c.b2 }]}>
                        {shown && <Ionicons name="checkmark" size={13} color="#FFF" />}
                      </View>
                      <Text style={{ flex: 1, color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{card.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable onPress={save} style={[S.submit, { backgroundColor: c.accent }]}>
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{t('common.save')}</Text>
              </Pressable>
            </BlurView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const S = StyleSheet.create({
  backdrop: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  panel: { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden' },
  header: { alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  inputRow: { alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 50 },
  segment: { borderWidth: 1, borderRadius: 12, padding: 3, gap: 3 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9 },
  cardRow: { alignItems: 'center', gap: 12, paddingVertical: 11 },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  submit: { marginTop: 16, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
