// components/ai/ReviewLayer.tsx
// THE reusable Review Layer. One coherent pattern shared by the Home
// "I understood your day" result and the Study revision plan.
// Per item: an explicit Add (persists that ONE item immediately, then becomes
// "Added ✓ · View" that deep-links into its section), Edit (title/type/date),
// and Ignore. Bottom CTA adds all pending at once. Nothing is written until the
// user asks — and "Added ✓" only shows after the row really persisted.
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import type { DetectedItem, EntityType, ReviewAction } from '@/services/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICON: Record<EntityType, keyof typeof Ionicons.glyphMap> = {
  journal: 'book-outline',
  appointment: 'calendar-outline',
  task: 'checkmark-circle-outline',
  checklist: 'list-outline',
  exam: 'school-outline',
  habit: 'repeat-outline',
  reminder: 'notifications-outline',
  note: 'document-text-outline',
  suggestion: 'sparkles-outline',
  meal: 'nutrition-outline',
  workout: 'barbell-outline',
  study_session: 'time-outline',
};

// One smart follow-up: the handful of types an ambiguous capture is usually
// confused between. Also the editable type set in the inline editor.
const CLARIFY: EntityType[] = ['task', 'reminder', 'appointment', 'note'];

interface EditPatch {
  title?: string;
  type?: EntityType;
  detail?: string;
}

interface Props {
  items: DetectedItem[];
  onAction: (id: string, action: ReviewAction) => void;
  onApplyAll: () => void;
  /** Persist ONE item now; the parent sets it accepted + item.route. */
  onAdd?: (item: DetectedItem) => void | Promise<void>;
  /** Apply an inline edit (title / type / date) before the item is added. */
  onEdit?: (id: string, patch: EditPatch) => void;
  /** Resolve an ambiguous item by picking its real type (one tap). */
  onReclassify?: (id: string, type: EntityType) => void;
  /** Heading + reply line shown above the list (Home result card). */
  reply?: string;
  compact?: boolean;
}

export const ReviewLayer = ({ items, onAction, onApplyAll, onAdd, onEdit, onReclassify, reply, compact }: Props) => {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditPatch>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  const pending = items.filter((i) => i.status === 'pending');
  const label = (type: EntityType) => t(`review.type_${type}`);

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const ignore = (id: string) => {
    animate();
    setEditId(null);
    onAction(id, 'ignore');
  };

  const runAdd = async (item: DetectedItem) => {
    if (!onAdd) return;
    setEditId(null);
    setAddingId(item.id);
    try {
      await Promise.resolve(onAdd(item));
    } finally {
      animate();
      setAddingId(null);
    }
  };

  // Destructive commands always ask for an explicit extra confirmation.
  const add = async (item: DetectedItem) => {
    if (!onAdd || addingId) return;
    if (item.op === 'delete') {
      Alert.alert(
        t('review.confirm_delete_title'),
        t('review.confirm_delete_body', { title: item.title }),
        [
          { text: t('review.cancel'), style: 'cancel' },
          { text: t('review.delete'), style: 'destructive', onPress: () => runAdd(item) },
        ],
      );
      return;
    }
    runAdd(item);
  };

  const openEdit = (item: DetectedItem) => {
    animate();
    setEditId(item.id);
    setDraft({ title: item.title, type: item.type, detail: item.detail ?? '' });
  };

  const saveEdit = (id: string) => {
    onEdit?.(id, { title: draft.title?.trim() || undefined, type: draft.type, detail: draft.detail });
    animate();
    setEditId(null);
  };

  const view = (item: DetectedItem) => {
    if (item.route) router.push(item.route as never);
  };

  const editTypes = Array.from(new Set<EntityType>([...CLARIFY, ...(draft.type ? [draft.type] : [])]));

  return (
    <View style={{ gap: 10 }}>
      {reply && (
        <View style={{ gap: 6, marginBottom: 2 }}>
          <View style={[S.aiTag, { flexDirection: rowDir }]}>
            <View style={[S.dot, { backgroundColor: c.accent }]} />
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('review.ai')}</Text>
          </View>
          <Text style={{ color: c.t1, fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign }}>{reply}</Text>
        </View>
      )}

      {items.map((item) => {
        const accepted = item.status === 'accepted';
        const ignored = item.status === 'ignored';
        const editing = editId === item.id;
        const adding = addingId === item.id;
        return (
          <View
            key={item.id}
            style={[
              S.item,
              {
                backgroundColor: c.bg1,
                borderColor: accepted ? c.accent + '66' : c.b1,
                opacity: ignored ? 0.4 : 1,
              },
            ]}
          >
            {/* Header: icon + type + title */}
            <View style={[S.row, { flexDirection: rowDir }]}>
              <View style={[S.iconWrap, { backgroundColor: c.bg3 }]}>
                <Ionicons name={ICON[item.type]} size={18} color={c.t1} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={[S.metaRow, { flexDirection: rowDir }]}>
                  <Text style={{ color: c.t3, fontSize: 11, fontWeight: '600' }}>{label(item.type)}</Text>
                  {item.confidence < 0.6 && !accepted && (
                    <Text style={{ color: c.orange, fontSize: 10 }}>· {t('review.uncertain')}</Text>
                  )}
                </View>
                <Text style={{ color: c.t1, fontSize: 15, fontWeight: '600', marginTop: 2, textAlign }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.detail ? (
                  <Text style={{ color: c.t2, fontSize: 12, marginTop: 2, textAlign }}>{item.detail}</Text>
                ) : null}
              </View>
            </View>

            {/* Smart follow-up: one inline question when the type is uncertain. */}
            {onReclassify && item.status === 'pending' && !editing && item.confidence < 0.6 && (
              <View style={[S.clarify, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                <Text style={{ color: c.t3, fontSize: 11, fontWeight: '600' }}>{t('review.which')}</Text>
                {CLARIFY.filter((o) => o !== item.type).map((o) => (
                  <Pressable key={o} onPress={() => onReclassify(item.id, o)} style={[S.chip, { backgroundColor: c.bg3 }]}>
                    <Ionicons name={ICON[o]} size={12} color={c.t2} />
                    <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>{label(o)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Inline editor: title / type / date */}
            {editing && (
              <View style={[S.editor, { borderTopColor: c.b0 }]}>
                <Text style={[S.editLabel, { color: c.t3, textAlign }]}>{t('review.title')}</Text>
                <TextInput
                  value={draft.title}
                  onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
                  style={[S.input, { backgroundColor: c.bg3, color: c.t1, borderColor: c.b1, textAlign }]}
                  placeholderTextColor={c.t4}
                />
                <Text style={[S.editLabel, { color: c.t3, textAlign }]}>{t('review.type')}</Text>
                <View style={[S.typeRow, { flexDirection: rowDir }]}>
                  {editTypes.map((o) => {
                    const on = draft.type === o;
                    return (
                      <Pressable
                        key={o}
                        onPress={() => setDraft((d) => ({ ...d, type: o }))}
                        style={[S.chip, { backgroundColor: on ? c.accentDim : c.bg3, borderColor: on ? c.accent : c.b1, borderWidth: 1 }]}
                      >
                        <Ionicons name={ICON[o]} size={12} color={on ? c.accent : c.t2} />
                        <Text style={{ color: on ? c.accent : c.t2, fontSize: 11, fontWeight: '600' }}>{label(o)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[S.editLabel, { color: c.t3, textAlign }]}>{t('review.date')}</Text>
                <TextInput
                  value={draft.detail}
                  onChangeText={(v) => setDraft((d) => ({ ...d, detail: v }))}
                  placeholder={t('review.date')}
                  placeholderTextColor={c.t4}
                  style={[S.input, { backgroundColor: c.bg3, color: c.t1, borderColor: c.b1, textAlign }]}
                />
                <Pressable onPress={() => saveEdit(item.id)} style={[S.saveBtn, { backgroundColor: c.accent }]}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('review.save')}</Text>
                </Pressable>
              </View>
            )}

            {/* Action row */}
            {!ignored && !editing && (
              <View style={[S.actions, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                {accepted ? (
                  <>
                    <View style={[S.addedPill, { flexDirection: rowDir }]}>
                      <Ionicons name="checkmark-circle" size={15} color={c.accent} />
                      <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>
                        {item.op === 'delete' ? t('review.deleted') : item.op === 'update' ? t('review.updated') : t('review.added')}
                      </Text>
                    </View>
                    {item.route && item.op !== 'delete' ? (
                      <Pressable onPress={() => view(item)} style={[S.viewBtn, { borderColor: c.b2, flexDirection: rowDir }]}>
                        <Text style={{ color: c.t1, fontSize: 12, fontWeight: '700' }}>{t('review.view')}</Text>
                        <Ionicons name={rowDir === 'row-reverse' ? 'chevron-back' : 'chevron-forward'} size={13} color={c.t2} />
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => add(item)}
                      disabled={adding}
                      style={[S.addBtn, { backgroundColor: item.op === 'delete' ? c.red : c.accent, flexDirection: rowDir }]}
                    >
                      {adding ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name={item.op === 'delete' ? 'trash-outline' : item.op === 'update' ? 'sync-outline' : 'add'} size={16} color="#FFF" />
                          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
                            {item.op === 'delete' ? t('review.delete') : item.op === 'update' ? t('review.apply_change') : t('review.add')}
                          </Text>
                        </>
                      )}
                    </Pressable>
                    {onEdit && (
                      <ActBtn icon="create-outline" label={t('review.edit')} onPress={() => openEdit(item)} c={c} />
                    )}
                    <ActBtn icon="eye-off-outline" label={t('review.ignore')} onPress={() => ignore(item.id)} c={c} />
                  </>
                )}
              </View>
            )}
          </View>
        );
      })}

      {pending.length > 0 && (
        <Pressable onPress={onApplyAll} style={[S.applyBtn, { backgroundColor: c.accent }]}>
          <Ionicons name="checkmark-done" size={18} color="#FFF" />
          <Text style={S.applyTxt}>{t('review.add_all', { n: pending.length })}</Text>
        </Pressable>
      )}
    </View>
  );
};

const ActBtn = ({ icon, label, onPress, c }: any) => (
  <Pressable onPress={onPress} style={S.actBtn}>
    <Ionicons name={icon} size={16} color={c.t2} />
    <Text style={{ color: c.t2, fontSize: 12, fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

const S = StyleSheet.create({
  aiTag: { alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  item: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, padding: 13 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metaRow: { alignItems: 'center', gap: 5 },
  clarify: { alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingBottom: 11, paddingTop: 2, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  editor: { borderTopWidth: StyleSheet.hairlineWidth, padding: 13, gap: 6 },
  editLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  typeRow: { gap: 6, flexWrap: 'wrap' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, height: 42, borderRadius: 12 },
  actions: { borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addBtn: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 18, height: 38, borderRadius: 11, minWidth: 96 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 9 },
  addedPill: { alignItems: 'center', gap: 5, flex: 1 },
  viewBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 16, height: 38, borderRadius: 11, borderWidth: 1 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, marginTop: 4 },
  applyTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
