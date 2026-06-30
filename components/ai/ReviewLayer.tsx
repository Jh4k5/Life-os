// components/ai/ReviewLayer.tsx
// THE reusable Review Layer. One coherent pattern shared by the Home
// "I understood your day" result, the AI Review Inbox, and AI Studio.
// Per item: Accept / Edit / Merge / Ignore / Delete. Nothing is written
// to the system until the user approves. Primary CTA: "Apply all".
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const LABEL: Record<EntityType, string> = {
  journal: 'يوميات',
  appointment: 'موعد',
  task: 'مهمة',
  checklist: 'قائمة',
  exam: 'امتحان',
  habit: 'عادة',
  reminder: 'تذكير',
  note: 'ملاحظة',
  suggestion: 'اقتراح',
  meal: 'وجبة',
  workout: 'تمرين',
  study_session: 'جلسة مذاكرة',
};

// One smart follow-up: the handful of types an ambiguous capture is usually
// confused between. Shown only when the model is unsure (confidence < 0.6).
const CLARIFY: EntityType[] = ['task', 'reminder', 'appointment', 'note'];

interface Props {
  items: DetectedItem[];
  onAction: (id: string, action: ReviewAction) => void;
  onApplyAll: () => void;
  /** Resolve an ambiguous item by picking its real type (one tap). */
  onReclassify?: (id: string, type: EntityType) => void;
  /** Heading + reply line shown above the list (Home result card). */
  reply?: string;
  compact?: boolean;
}

export const ReviewLayer = ({ items, onAction, onApplyAll, onReclassify, reply, compact }: Props) => {
  const { c } = useTheme();
  const { rowDir } = useRTL();
  const [openId, setOpenId] = useState<string | null>(null);

  const pending = items.filter((i) => i.status === 'pending');

  const act = (id: string, action: ReviewAction) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(null);
    onAction(id, action);
  };

  return (
    <View style={{ gap: 10 }}>
      {reply && (
        <View style={{ gap: 6, marginBottom: 2 }}>
          <View style={[S.aiTag, { flexDirection: rowDir }]}>
            <View style={[S.dot, { backgroundColor: c.accent }]} />
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>الذكاء</Text>
          </View>
          <Text style={{ color: c.t1, fontSize: 18, fontWeight: '700', lineHeight: 26 }}>{reply}</Text>
        </View>
      )}

      {items.map((item) => {
        const open = openId === item.id;
        const accepted = item.status === 'accepted';
        const ignored = item.status === 'ignored';
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
            <Pressable
              onPress={() => act(item.id, accepted ? 'ignore' : 'accept')}
              style={[S.row, { flexDirection: rowDir }]}
            >
              <View style={[S.iconWrap, { backgroundColor: c.bg3 }]}>
                <Ionicons name={ICON[item.type]} size={18} color={c.t1} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={[S.metaRow, { flexDirection: rowDir }]}>
                  <Text style={{ color: c.t3, fontSize: 11, fontWeight: '600' }}>{LABEL[item.type]}</Text>
                  {item.confidence < 0.6 && (
                    <Text style={{ color: c.orange, fontSize: 10 }}>· غير متأكد</Text>
                  )}
                </View>
                <Text style={{ color: c.t1, fontSize: 15, fontWeight: '600', marginTop: 2 }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.detail && (
                  <Text style={{ color: c.t2, fontSize: 12, marginTop: 2 }}>{item.detail}</Text>
                )}
              </View>
              <View
                style={[
                  S.check,
                  {
                    backgroundColor: accepted ? c.accent : 'transparent',
                    borderColor: accepted ? c.accent : c.b2,
                  },
                ]}
              >
                {accepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </Pressable>

            {/* Smart follow-up: one inline question when the type is uncertain. */}
            {onReclassify && item.status === 'pending' && item.confidence < 0.6 && (
              <View style={[S.clarify, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                <Text style={{ color: c.t3, fontSize: 11, fontWeight: '600' }}>أهو…؟</Text>
                {CLARIFY.filter((o) => o !== item.type).map((o) => (
                  <Pressable
                    key={o}
                    onPress={() => onReclassify(item.id, o)}
                    style={[S.chip, { backgroundColor: c.bg3 }]}
                  >
                    <Ionicons name={ICON[o]} size={12} color={c.t2} />
                    <Text style={{ color: c.t2, fontSize: 11, fontWeight: '600' }}>{LABEL[o]}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {!compact && (
              <>
                <Pressable onPress={() => setOpenId(open ? null : item.id)} style={S.moreBtn}>
                  <Ionicons name={open ? 'chevron-up' : 'ellipsis-horizontal'} size={16} color={c.t3} />
                </Pressable>
                {open && (
                  <View style={[S.actions, { flexDirection: rowDir, borderTopColor: c.b0 }]}>
                    <ActBtn icon="create-outline" label="تعديل" onPress={() => act(item.id, 'edit')} c={c} />
                    <ActBtn icon="git-merge-outline" label="دمج" onPress={() => act(item.id, 'merge')} c={c} />
                    <ActBtn icon="eye-off-outline" label="تجاهل" onPress={() => act(item.id, 'ignore')} c={c} />
                    <ActBtn icon="trash-outline" label="حذف" onPress={() => act(item.id, 'delete')} c={c} danger />
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}

      {pending.length > 0 && (
        <Pressable onPress={onApplyAll} style={[S.applyBtn, { backgroundColor: c.accent }]}>
          <Ionicons name="checkmark-done" size={18} color="#FFF" />
          <Text style={S.applyTxt}>تطبيق الكل ({pending.length})</Text>
        </Pressable>
      )}
    </View>
  );
};

const ActBtn = ({ icon, label, onPress, c, danger }: any) => (
  <Pressable onPress={onPress} style={S.actBtn}>
    <Ionicons name={icon} size={16} color={danger ? c.red : c.t2} />
    <Text style={{ color: danger ? c.red : c.t2, fontSize: 12, fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

const S = StyleSheet.create({
  aiTag: { alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  item: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, padding: 13 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metaRow: { alignItems: 'center', gap: 5 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  moreBtn: { position: 'absolute', top: 8, end: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clarify: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingBottom: 11,
    paddingTop: 2,
    flexWrap: 'wrap',
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  actions: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4 },
  actBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 10 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 4,
  },
  applyTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
