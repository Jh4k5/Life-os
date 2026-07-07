// app/(tabs)/more/habits/new.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { HabitCard, type HabitData } from '@/components/ui/HabitCard';
import { repository } from '@/services/repository';
import { useAsync } from '@/hooks/useAsync';

type HType = 'checkbox' | 'counter' | 'timer' | 'stopwatch' | 'quantity';
type Freq = 'daily' | 'weekly' | 'monthly' | 'custom';

const EMOJIS = ['⭐', '💧', '📖', '🏃', '🧘', '💊', '✍', '🎵', '💪', '🥗', '🌿', '📝', '🎯', '💡', '🌙', '☀', '🙏', '🎓', '🔢', '⏱'];
const COLORS = ['#3B82F6', '#00D084', '#EF4444', '#A855F7', '#F59E0B', '#14B8A6', '#EC4899', '#8B5CF6', '#06B6D4', '#D97706', '#10B981', '#6366F1'];
const DAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

const TYPES: { key: HType; icon: string; label: string; desc: string }[] = [
  { key: 'checkbox', icon: '☑', label: 'صح/خطأ', desc: 'فعلته أم لا' },
  { key: 'counter', icon: '🔢', label: 'عداد', desc: 'احسب كم مرة' },
  { key: 'timer', icon: '⏱', label: 'مؤقت', desc: 'استمر لوقت محدد' },
  { key: 'stopwatch', icon: '⏱', label: 'كرونومتر', desc: 'سجّل الوقت بحرية' },
  { key: 'quantity', icon: '📏', label: 'كمية', desc: 'تتبع بوحدة مخصصة' },
];

export default function NewHabitScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [color, setColor] = useState('#A855F7');
  const [type, setType] = useState<HType>('checkbox');
  const [freq, setFreq] = useState<Freq>('daily');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('مرة');
  const [timePref, setTimePref] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [customDays, setCustomDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [reminders, setReminders] = useState(['08:00']);
  const [noteEnabled, setNoteEnabled] = useState(false);
  const [retroEnabled, setRetroEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const { data: areas } = useAsync(() => repository.listAreas(), []);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await repository.addHabit({ name: name.trim(), emoji, color, type, target, unit, freq, timePref, areaId });
    router.back();
  };

  const toggleDay = (d: number) =>
    setCustomDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

  const preview: HabitData = {
    id: 'preview',
    name: name || 'اسم العادة',
    emoji,
    color,
    type,
    target,
    unit,
    streak: 0,
    bestStreak: 0,
    todayValue: 0,
    done: false,
    timePref,
  };

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: 10 }}>
      <Text style={[S.secLabel, { color: c.t2 }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title="عادة جديدة"
        accent={c.habits}
        right={[{ icon: 'checkmark', onPress: save, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 120 }}>
        {/* Preview حي */}
        <HabitCard habit={preview} onUpdate={() => {}} />

        {/* الاسم والأيقونة */}
        <Sec title="الاسم والأيقونة">
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pressable style={[S.emojiSel, { backgroundColor: color + '22', borderColor: color }]}>
              <Text style={{ fontSize: 30 }}>{emoji}</Text>
            </Pressable>
            <TextInput
              style={[S.nameInput, { backgroundColor: c.bg2, borderColor: c.b1, color: c.t1 }]}
              placeholder="اسم العادة (بأي لغة)…"
              placeholderTextColor={c.t4}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={S.emojiGrid}>
            {EMOJIS.map((em) => (
              <Pressable
                key={em}
                onPress={() => setEmoji(em)}
                style={[
                  S.emojiBtn,
                  {
                    backgroundColor: emoji === em ? color + '30' : c.bg2,
                    borderColor: emoji === em ? color : c.b0,
                    borderWidth: emoji === em ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{em}</Text>
              </Pressable>
            ))}
          </View>
        </Sec>

        {/* اللون */}
        <Sec title="اللون">
          <View style={S.colorRow}>
            {COLORS.map((clr) => (
              <Pressable
                key={clr}
                onPress={() => setColor(clr)}
                style={[
                  S.colorDot,
                  {
                    backgroundColor: clr,
                    transform: [{ scale: color === clr ? 1.3 : 1 }],
                    borderWidth: color === clr ? 3 : 0,
                    borderColor: '#FFF',
                  },
                ]}
              />
            ))}
          </View>
        </Sec>

        {/* النوع */}
        <Sec title="نوع العادة">
          <View style={S.typeGrid}>
            {TYPES.map((tp) => (
              <Pressable
                key={tp.key}
                onPress={() => setType(tp.key)}
                style={[
                  S.typeBtn,
                  {
                    backgroundColor: type === tp.key ? color + '20' : c.bg2,
                    borderColor: type === tp.key ? color : c.b1,
                    borderWidth: type === tp.key ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{tp.icon}</Text>
                <Text style={{ color: type === tp.key ? color : c.t1, fontWeight: '700', fontSize: 13 }}>
                  {tp.label}
                </Text>
                <Text style={{ color: c.t3, fontSize: 11, textAlign: 'center' }}>{tp.desc}</Text>
              </Pressable>
            ))}
          </View>
        </Sec>

        {/* الهدف */}
        {(type === 'counter' || type === 'timer' || type === 'quantity') && (
          <Sec title={type === 'timer' ? 'الهدف الزمني (دقائق)' : 'الهدف اليومي'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable
                onPress={() => setTarget((tv) => Math.max(1, tv - 1))}
                style={[S.tBtn, { borderColor: c.b2 }]}
              >
                <Ionicons name="remove" size={20} color={c.t2} />
              </Pressable>
              <Text style={[S.tVal, { color: c.t1 }]}>{target}</Text>
              <Pressable
                onPress={() => setTarget((tv) => tv + 1)}
                style={[S.tBtn, { backgroundColor: color, borderColor: color }]}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </Pressable>
              {(type === 'counter' || type === 'quantity') && (
                <TextInput
                  style={[S.unitInput, { backgroundColor: c.bg2, borderColor: c.b1, color: c.t1 }]}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="الوحدة"
                  placeholderTextColor={c.t4}
                />
              )}
              {type === 'timer' && <Text style={{ color: c.t2, fontSize: 15 }}>دقيقة</Text>}
            </View>
          </Sec>
        )}

        {/* التكرار */}
        <Sec title="التكرار">
          <View style={S.freqRow}>
            {(
              [
                ['daily', 'يومي'],
                ['weekly', 'أسبوعي'],
                ['monthly', 'شهري'],
                ['custom', 'مخصص'],
              ] as [Freq, string][]
            ).map(([k, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setFreq(k)}
                style={[
                  S.freqBtn,
                  { backgroundColor: freq === k ? color : c.bg2, borderColor: freq === k ? color : c.b1 },
                ]}
              >
                <Text style={{ color: freq === k ? '#FFF' : c.t2, fontWeight: '600', fontSize: 13 }}>{lbl}</Text>
              </Pressable>
            ))}
          </View>
          {freq === 'custom' && (
            <View style={S.daysRow}>
              {DAYS_AR.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i + 1)}
                  style={[
                    S.dayBtn,
                    {
                      backgroundColor: customDays.includes(i + 1) ? color : c.bg2,
                      borderColor: customDays.includes(i + 1) ? color : c.b1,
                    },
                  ]}
                >
                  <Text style={{ color: customDays.includes(i + 1) ? '#FFF' : c.t2, fontWeight: '700' }}>{d}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Sec>

        {/* الوقت المفضل */}
        <Sec title="الوقت المفضل">
          <View style={S.freqRow}>
            {(
              [
                ['morning', '🌅 صباح'],
                ['afternoon', '☀ ظهر'],
                ['evening', '🌙 مساء'],
                ['anytime', '🕐 أي وقت'],
              ] as const
            ).map(([k, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setTimePref(k)}
                style={[
                  S.freqBtn,
                  { backgroundColor: timePref === k ? color : c.bg2, borderColor: timePref === k ? color : c.b1 },
                ]}
              >
                <Text style={{ color: timePref === k ? '#FFF' : c.t2, fontSize: 12, fontWeight: '600' }}>{lbl}</Text>
              </Pressable>
            ))}
          </View>
        </Sec>

        {/* التذكيرات */}
        <Sec title="التذكيرات">
          {reminders.map((r, i) => (
            <View key={i} style={[S.reminderRow, { backgroundColor: c.bg2, borderColor: c.b1 }]}>
              <Ionicons name="alarm-outline" size={16} color={color} />
              <Text style={{ color: c.t1, flex: 1 }}>{r}</Text>
              <Pressable onPress={() => setReminders((p) => p.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={18} color={c.t3} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => setReminders((p) => [...p, '09:00'])}
            style={[S.addRemBtn, { borderColor: c.b2 }]}
          >
            <Ionicons name="add" size={16} color={c.accent} />
            <Text style={{ color: c.accent, fontWeight: '600' }}>إضافة تذكير</Text>
          </Pressable>
        </Sec>

        {/* ربط بمنطقة */}
        <Sec title="ربط بمنطقة (اختياري)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setAreaId(null)}
                style={[
                  S.areaChip,
                  { backgroundColor: !areaId ? c.accent + '20' : c.bg2, borderColor: !areaId ? c.accent : c.b1 },
                ]}
              >
                <Text style={{ color: !areaId ? c.accent : c.t2, fontSize: 13 }}>بدون ربط</Text>
              </Pressable>
              {areas.map((area) => (
                <Pressable
                  key={area.id}
                  onPress={() => setAreaId(area.id)}
                  style={[
                    S.areaChip,
                    {
                      backgroundColor: areaId === area.id ? area.color + '20' : c.bg2,
                      borderColor: areaId === area.id ? area.color : c.b1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{area.emoji}</Text>
                  <Text style={{ color: areaId === area.id ? area.color : c.t2, fontSize: 13 }}>{area.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Sec>

        {/* خيارات */}
        <Sec title="خيارات إضافية">
          <SmartCard>
            <ToggleRow
              label="ملاحظة عند الإكمال"
              desc="اكتب تعليقاً عند إكمال العادة"
              value={noteEnabled}
              onChange={setNoteEnabled}
              color={color}
              c={c}
            />
            <View style={[S.divider, { backgroundColor: c.b0 }]} />
            <ToggleRow
              label="إكمال بأثر رجعي"
              desc="أضف إكمال ليوم سابق بدون ذنب"
              value={retroEnabled}
              onChange={setRetroEnabled}
              color={color}
              c={c}
            />
          </SmartCard>
        </Sec>

        {/* Save */}
        <Pressable onPress={save} style={[S.saveBtn, { backgroundColor: color }]}>
          <Text style={S.saveTxt}>+ إضافة العادة</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const ToggleRow = ({ label, desc, value, onChange, color, c }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.t1, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: c.t3, fontSize: 12, marginTop: 2 }}>{desc}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: c.b2, true: color + '80' }}
      thumbColor={value ? color : c.t3}
    />
  </View>
);

const S = StyleSheet.create({
  screen: { flex: 1 },
  secLabel: { fontSize: 14, fontWeight: '700' },
  emojiSel: { width: 62, height: 62, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nameInput: { flex: 1, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 52, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { width: '48%', padding: 14, borderRadius: 14, alignItems: 'center', gap: 4 },
  tBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tVal: { fontSize: 30, fontWeight: '800', minWidth: 52, textAlign: 'center' },
  unitInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addRemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  divider: { height: 1, marginVertical: 4 },
  saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveTxt: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
