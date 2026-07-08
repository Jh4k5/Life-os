// app/(tabs)/more/dopamine/index.tsx  → "Wellbeing"
// Calm digital-wellbeing signal, fully real & fully editable: the user defines
// their own healthy / draining activities (add / edit / delete / log), a manual
// daily screen-time goal (customization), and self-set focus rules (e.g. "no
// phone after 22:00") that can schedule a gentle local reminder. There is no OS
// Screen-Time API — every number here is the user's own. Cards are a keyed
// config filtered by the user's hidden-cards preference.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { QuickLogSheet } from '@/components/ui/QuickLogSheet';
import { SectionCustomizeSheet } from '@/components/ui/SectionCustomizeSheet';
import { repository } from '@/services/repository';
import { intelligence, type Insight } from '@/services/intelligence';
import { useAsync } from '@/hooks/useAsync';
import { feedback } from '@/services/feedback';
import { notifications } from '@/services/notifications';
import { useSectionPref, nextAtTime } from '@/store/sectionPrefs';
import type { WellbeingRule } from '@/services/types';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface Activity { id: string; name: string; type: 'healthy' | 'draining'; loggedToday: boolean }

export default function WellbeingScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const prefs = useSectionPref('wellbeing');
  const { data: activities, reload } = useAsync(() => repository.listWellbeing(), [] as Activity[], 'wellbeing');
  const { data: week, reload: reloadWeek } = useAsync(() => repository.wellbeingWeek(), [0, 0, 0, 0, 0, 0, 0], 'wellbeingWeek');
  const { data: rules, reload: reloadRules } = useAsync(() => repository.listWellbeingRules(), [] as WellbeingRule[], 'wellbeingRules');
  const [nudges, setNudges] = useState<Insight[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [adding, setAdding] = useState<null | 'healthy' | 'draining'>(null);
  const [editAct, setEditAct] = useState<Activity | null>(null);
  const [ruleSheet, setRuleSheet] = useState<null | 'new' | WellbeingRule>(null);
  const [customize, setCustomize] = useState(false);

  React.useEffect(() => {
    intelligence
      .listInsights()
      .then((ins) => setNudges(ins.filter((i) => i.domain === 'wellbeing' || i.domain === 'journal').slice(0, 2)))
      .catch(() => {});
  }, []);

  const isHidden = (k: string) => prefs.hiddenCards.includes(k);

  const toggle = async (id: string) => {
    feedback.select();
    await repository.toggleWellbeingToday(id);
    reload();
    reloadWeek();
  };

  const addActivity = async (v: Record<string, string>) => {
    const name = (v.name ?? '').trim();
    if (!name || !adding) return;
    await repository.addWellbeingActivity(name, adding);
    reload();
  };

  const saveRule = async (text: string, time: string | null) => {
    if (ruleSheet === 'new') await repository.addWellbeingRule({ text, time });
    else if (ruleSheet) await repository.updateWellbeingRule(ruleSheet.id, { text, time });
    // A rule with a time schedules a real local reminder (gated by the app's
    // Notifications toggle inside notifications.ts). Never a fake success.
    const at = time ? nextAtTime(time) : null;
    if (at) await notifications.scheduleReminder(t('dopamine.rule_reminder_title'), text, at).catch(() => {});
    reloadRules();
  };

  const maxAbs = Math.max(...week.map((v) => Math.abs(v)), 1);
  const totalAbs = week.reduce((s, v) => s + Math.abs(v), 0);
  const healthyShare = totalAbs
    ? Math.round((week.filter((v) => v > 0).reduce((s, v) => s + v, 0) / totalAbs) * 100)
    : 0;

  const cardNodes: { key: string; node: React.ReactNode }[] = [
    {
      key: 'week',
      node: (
        <SmartCard>
          <View style={[S.week, { flexDirection: rowDir }]}>
            {week.map((v, i) => {
              const h = 8 + (Math.abs(v) / maxAbs) * 60;
              const healthy = v >= 0;
              return (
                <View key={i} style={S.dayCol}>
                  <View style={S.track}>
                    <View style={{ width: 8, height: h, borderRadius: 4, backgroundColor: healthy ? c.accent : c.b2, opacity: healthy ? 0.9 : 0.6 }} />
                  </View>
                  <Text style={{ color: c.t3, fontSize: 10 }}>{t(`dopamine.day_${DAY_KEYS[i]}`)}</Text>
                </View>
              );
            })}
          </View>
        </SmartCard>
      ),
    },
    {
      key: 'screentime',
      node: (
        <Pressable onPress={() => { feedback.tap(); setCustomize(true); }}>
          <SmartCard>
            <View style={[{ alignItems: 'center', gap: 12 }, { flexDirection: rowDir }]}>
              <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontSize: 14, fontWeight: '700', textAlign }}>{t('dopamine.screen_time_goal')}</Text>
                <Text style={{ color: c.t3, fontSize: 12, marginTop: 2, textAlign }}>{t('dopamine.screen_time_manual')}</Text>
              </View>
              <Text style={{ color: c.t1, fontSize: 16, fontWeight: '800' }}>{t('dopamine.min_value', { n: prefs.goals.screenTimeTargetMin })}</Text>
            </View>
          </SmartCard>
        </Pressable>
      ),
    },
  ];

  const showNudges = !isHidden('nudges') && nudges.length > 0;

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={prefs.icon ? `${prefs.icon} ${t('sections.wellbeing')}` : t('sections.wellbeing')}
        accent={c.accent}
        right={[
          { icon: 'options-outline', onPress: () => { feedback.tap(); setCustomize(true); }, color: c.t2 },
          { icon: 'add', onPress: () => { feedback.tap(); setAdding('healthy'); }, color: c.accent },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 110 }}>
        {/* Calm state line — reflects real logs */}
        <Text style={[S.state, { color: c.t1, textAlign }]}>
          {totalAbs === 0 ? t('dopamine.empty_state') : t('dopamine.balance_line', { pct: healthyShare })}
        </Text>

        {cardNodes.filter((cn) => !isHidden(cn.key)).map((cn) => (
          <React.Fragment key={cn.key}>{cn.node}</React.Fragment>
        ))}

        {/* AI nudges — real insights when available */}
        {showNudges && <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.from_ai')}</Text>}
        {showNudges && nudges.map((n) => {
          const done = applied.includes(n.id);
          return (
            <SmartCard key={n.id}>
              <View style={[S.nudge, { flexDirection: rowDir }]}>
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name="sparkles-outline" size={18} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 14, lineHeight: 22, textAlign }}>{n.title}</Text>
              </View>
              <Pressable
                onPress={() => { feedback.success(); setApplied((p) => (p.includes(n.id) ? p : [...p, n.id])); }}
                style={[S.applyBtn, { backgroundColor: done ? c.greenDim : c.accentDim, borderColor: done ? c.green : c.accent + '55' }]}
              >
                <Ionicons name={done ? 'checkmark' : 'sparkles-outline'} size={15} color={done ? c.green : c.accent} />
                <Text style={{ color: done ? c.green : c.accent, fontWeight: '700', fontSize: 13 }}>
                  {done ? t('dopamine.applied') : t('dopamine.apply')}
                </Text>
              </Pressable>
            </SmartCard>
          );
        })}

        {/* Activities — real, user-defined, logged per day */}
        <View style={[{ alignItems: 'center', justifyContent: 'space-between' }, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.activities')}</Text>
          <View style={{ flexDirection: rowDir, gap: 8 }}>
            <Pressable onPress={() => { feedback.tap(); setAdding('healthy'); }} style={[S.addChip, { backgroundColor: c.accentDim }]}>
              <Ionicons name="leaf-outline" size={13} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('dopamine.add_healthy')}</Text>
            </Pressable>
            <Pressable onPress={() => { feedback.tap(); setAdding('draining'); }} style={[S.addChip, { backgroundColor: c.bg3 }]}>
              <Ionicons name="hourglass-outline" size={13} color={c.t3} />
              <Text style={{ color: c.t3, fontSize: 12, fontWeight: '700' }}>{t('dopamine.add_draining')}</Text>
            </Pressable>
          </View>
        </View>

        {activities.length === 0 ? (
          <SmartCard>
            <Text style={{ color: c.t3, fontSize: 13, lineHeight: 20, textAlign }}>{t('dopamine.no_activities')}</Text>
          </SmartCard>
        ) : (
          <SmartCard noPad>
            {activities.map((a, i) => (
              <Pressable
                key={a.id}
                onPress={() => toggle(a.id)}
                onLongPress={async () => { feedback.warning(); await repository.removeWellbeingActivity(a.id); reload(); reloadWeek(); }}
                style={[S.actRow, { flexDirection: rowDir }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
              >
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name={a.type === 'healthy' ? 'leaf-outline' : 'hourglass-outline'} size={16} color={a.type === 'healthy' ? c.accent : c.t3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{a.name}</Text>
                  <Text style={{ color: c.t3, fontSize: 11, marginTop: 2, textAlign }}>
                    {a.type === 'healthy' ? t('dopamine.nourishes') : t('dopamine.drains')}
                  </Text>
                </View>
                <Pressable onPress={() => { feedback.tap(); setEditAct(a); }} hitSlop={8} style={{ padding: 4 }}>
                  <Ionicons name="pencil" size={15} color={c.t3} />
                </Pressable>
                <View style={[S.check, { backgroundColor: a.loggedToday ? c.accent : 'transparent', borderColor: a.loggedToday ? c.accent : c.b2 }]}>
                  {a.loggedToday && <Ionicons name="checkmark" size={13} color="#FFF" />}
                </View>
              </Pressable>
            ))}
          </SmartCard>
        )}
        {activities.length > 0 && (
          <Text style={{ color: c.t4, fontSize: 11, textAlign, paddingHorizontal: 4 }}>{t('dopamine.long_press_delete')}</Text>
        )}

        {/* Focus rules — self-defined, editable, may schedule a gentle reminder */}
        <View style={[{ alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }, { flexDirection: rowDir }]}>
          <Text style={[S.label, { color: c.t3, textAlign }]}>{t('dopamine.focus_rules')}</Text>
          <Pressable onPress={() => { feedback.tap(); setRuleSheet('new'); }} style={[S.addChip, { backgroundColor: c.accentDim }]}>
            <Ionicons name="add" size={14} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('dopamine.add_rule')}</Text>
          </Pressable>
        </View>

        {rules.length === 0 ? (
          <SmartCard>
            <Text style={{ color: c.t3, fontSize: 13, lineHeight: 20, textAlign }}>{t('dopamine.no_rules')}</Text>
          </SmartCard>
        ) : (
          <SmartCard noPad>
            {rules.map((r, i) => (
              <Pressable
                key={r.id}
                onPress={() => { feedback.tap(); setRuleSheet(r); }}
                style={[S.actRow, { flexDirection: rowDir }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.b0 }]}
              >
                <View style={[S.nIcon, { backgroundColor: c.bg3 }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontSize: 14, fontWeight: '600', textAlign }}>{r.text}</Text>
                  {r.time ? (
                    <Text style={{ color: c.t3, fontSize: 11, marginTop: 2, textAlign }}>
                      {t('dopamine.rule_at', { time: r.time })}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="pencil" size={15} color={c.t3} />
              </Pressable>
            ))}
          </SmartCard>
        )}
      </ScrollView>

      {adding && (
        <QuickLogSheet
          visible={!!adding}
          title={adding === 'healthy' ? t('dopamine.add_healthy') : t('dopamine.add_draining')}
          icon={adding === 'healthy' ? 'leaf-outline' : 'hourglass-outline'}
          fields={[{ key: 'name', label: t('dopamine.activity_name'), placeholder: t('dopamine.activity_name') }]}
          submitLabel={t('dopamine.add')}
          onClose={() => setAdding(null)}
          onSubmit={addActivity}
        />
      )}

      {editAct && (
        <ActivityEditSheet
          activity={editAct}
          onClose={() => setEditAct(null)}
          onSave={async (name, type) => { await repository.updateWellbeingActivity(editAct.id, { name, type }); reload(); reloadWeek(); }}
          onDelete={async () => { await repository.removeWellbeingActivity(editAct.id); reload(); reloadWeek(); }}
        />
      )}

      {ruleSheet && (
        <RuleEditSheet
          rule={ruleSheet === 'new' ? null : ruleSheet}
          onClose={() => setRuleSheet(null)}
          onSave={saveRule}
          onDelete={ruleSheet === 'new' ? undefined : async () => { await repository.deleteWellbeingRule(ruleSheet.id); reloadRules(); }}
        />
      )}

      {customize && (
        <SectionCustomizeSheet
          visible={customize}
          section="wellbeing"
          title={t('customize.wellbeing_title')}
          iconEnabled
          goalFields={[{ key: 'screenTimeTargetMin', label: t('dopamine.screen_time_goal'), suffix: t('dopamine.min_unit') }]}
          unitToggles={[]}
          cards={[
            { key: 'week', label: t('dopamine.card_week') },
            { key: 'screentime', label: t('dopamine.screen_time_goal') },
            { key: 'nudges', label: t('dopamine.from_ai') },
          ]}
          reminderTitle={t('dopamine.rule_reminder_title')}
          onClose={() => setCustomize(false)}
        />
      )}
    </View>
  );
}

// ── Activity editor: name + healthy/draining, with delete ──
const ActivityEditSheet = ({
  activity,
  onClose,
  onSave,
  onDelete,
}: {
  activity: Activity;
  onClose: () => void;
  onSave: (name: string, type: 'healthy' | 'draining') => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const [name, setName] = useState(activity.name);
  const [type, setType] = useState<'healthy' | 'draining'>(activity.type);
  const canSave = name.trim().length > 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={RS.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 24 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={RS.center}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[RS.panel, { backgroundColor: c.glass, borderColor: 'rgba(255,255,255,0.14)' }]}>
              <View style={[RS.header, { flexDirection: rowDir }]}>
                <View style={[RS.iconWrap, { backgroundColor: c.accent + '22' }]}>
                  <Ionicons name="pencil" size={16} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 17, fontWeight: '800', textAlign }}>{t('dopamine.edit_activity')}</Text>
                <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={c.t3} /></Pressable>
              </View>

              <Text style={[RS.label, { color: c.t3, textAlign }]}>{t('dopamine.activity_name')}</Text>
              <View style={[RS.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                <TextInput value={name} onChangeText={setName} placeholder={t('dopamine.activity_name')} placeholderTextColor={c.t4} style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }} />
              </View>

              <Text style={[RS.label, { color: c.t3, textAlign, marginTop: 14 }]}>{t('dopamine.type')}</Text>
              <View style={[RS.segment, { flexDirection: rowDir, backgroundColor: c.bg3, borderColor: c.b1 }]}>
                {(['healthy', 'draining'] as const).map((ty) => {
                  const on = type === ty;
                  return (
                    <Pressable key={ty} onPress={() => { feedback.select(); setType(ty); }} style={[RS.segBtn, { backgroundColor: on ? c.accent : 'transparent' }]}>
                      <Text style={{ color: on ? '#FFF' : c.t2, fontSize: 13, fontWeight: '700' }}>{ty === 'healthy' ? t('dopamine.nourishes') : t('dopamine.drains')}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => { if (!canSave) return; feedback.success(); onSave(name.trim(), type); onClose(); }} disabled={!canSave} style={[RS.submit, { backgroundColor: canSave ? c.accent : c.b2, opacity: canSave ? 1 : 0.6 }]}>
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{t('common.save')}</Text>
              </Pressable>
              <Pressable onPress={() => { feedback.warning(); onDelete(); onClose(); }} style={RS.deleteBtn}>
                <Ionicons name="trash-outline" size={15} color={c.red} />
                <Text style={{ color: c.red, fontSize: 14, fontWeight: '700' }}>{t('common.delete')}</Text>
              </Pressable>
            </BlurView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

// ── Focus-rule editor: text + optional HH:MM, with delete ──
const RuleEditSheet = ({
  rule,
  onClose,
  onSave,
  onDelete,
}: {
  rule: WellbeingRule | null;
  onClose: () => void;
  onSave: (text: string, time: string | null) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) => {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const [text, setText] = useState(rule?.text ?? '');
  const [time, setTime] = useState(rule?.time ?? '');
  const canSave = text.trim().length > 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={RS.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 24 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={RS.center}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[RS.panel, { backgroundColor: c.glass, borderColor: 'rgba(255,255,255,0.14)' }]}>
              <View style={[RS.header, { flexDirection: rowDir }]}>
                <View style={[RS.iconWrap, { backgroundColor: c.accent + '22' }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 17, fontWeight: '800', textAlign }}>{rule ? t('dopamine.edit_rule') : t('dopamine.new_rule')}</Text>
                <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={c.t3} /></Pressable>
              </View>

              <Text style={[RS.label, { color: c.t3, textAlign }]}>{t('dopamine.rule_text')}</Text>
              <View style={[RS.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                <TextInput value={text} onChangeText={setText} placeholder={t('dopamine.rule_ph')} placeholderTextColor={c.t4} style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }} />
              </View>

              <Text style={[RS.label, { color: c.t3, textAlign, marginTop: 14 }]}>{t('dopamine.rule_time')}</Text>
              <View style={[RS.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                <TextInput value={time} onChangeText={setTime} placeholder={t('customize.time_ph')} placeholderTextColor={c.t4} style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }} />
                <Ionicons name="notifications-outline" size={16} color={c.t3} />
              </View>

              <Pressable onPress={() => { if (!canSave) return; feedback.success(); onSave(text.trim(), time.trim() || null); onClose(); }} disabled={!canSave} style={[RS.submit, { backgroundColor: canSave ? c.accent : c.b2, opacity: canSave ? 1 : 0.6 }]}>
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{t('common.save')}</Text>
              </Pressable>
              {onDelete ? (
                <Pressable onPress={() => { feedback.warning(); onDelete(); onClose(); }} style={RS.deleteBtn}>
                  <Ionicons name="trash-outline" size={15} color={c.red} />
                  <Text style={{ color: c.red, fontSize: 14, fontWeight: '700' }}>{t('common.delete')}</Text>
                </Pressable>
              ) : null}
            </BlurView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const S = StyleSheet.create({
  screen: { flex: 1 },
  state: { fontSize: 19, fontWeight: '700', lineHeight: 28 },
  week: { justifyContent: 'space-between', alignItems: 'flex-end', height: 90, paddingHorizontal: 4 },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  track: { height: 70, justifyContent: 'flex-end' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  nudge: { gap: 12, alignItems: 'flex-start' },
  nIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  actRow: { alignItems: 'center', gap: 12, padding: 14 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

const RS = StyleSheet.create({
  backdrop: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  panel: { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden' },
  header: { alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  inputRow: { alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 50, marginTop: 6 },
  segment: { borderWidth: 1, borderRadius: 12, padding: 3, gap: 3, marginTop: 6 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9 },
  submit: { marginTop: 18, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { marginTop: 10, height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
