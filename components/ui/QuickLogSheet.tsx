// components/ui/QuickLogSheet.tsx
// A small, reusable glass entry sheet: give it a title + a list of fields and
// it collects values and hands them back on submit. Used anywhere the user
// needs to log a value by hand (health metrics, a quick meal, a weight, …).
// Glassy by design — a blurred backdrop + a frosted panel that slides up.
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { feedback } from '@/services/feedback';

export interface SheetField {
  key: string;
  label: string;
  placeholder?: string;
  suffix?: string;
  numeric?: boolean;
  initial?: string;
}

interface Props {
  visible: boolean;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  fields: SheetField[];
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

export const QuickLogSheet = ({
  visible,
  title,
  icon = 'create-outline',
  fields,
  submitLabel = 'حفظ',
  onClose,
  onSubmit,
}: Props) => {
  const { c, isDark } = useTheme();
  const { rowDir, textAlign } = useRTL();
  const [values, setValues] = useState<Record<string, string>>({});

  // Seed field defaults whenever the sheet (re)opens.
  useEffect(() => {
    if (visible) {
      const seed: Record<string, string> = {};
      fields.forEach((f) => (seed[f.key] = f.initial ?? ''));
      setValues(seed);
    }
  }, [visible]);

  const submit = () => {
    feedback.success();
    onSubmit(values);
    onClose();
  };

  const primary = fields[0];
  const canSubmit = primary ? (values[primary.key] ?? '').trim().length > 0 : true;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <BlurView intensity={isDark ? 24 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={S.center}
        >
          {/* Stop taps inside the panel from dismissing. */}
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={[
                S.panel,
                { backgroundColor: c.glass, borderColor: 'rgba(255,255,255,0.14)' },
              ]}
            >
              <View style={[S.header, { flexDirection: rowDir }]}>
                <View style={[S.iconWrap, { backgroundColor: c.accent + '22' }]}>
                  <Ionicons name={icon} size={18} color={c.accent} />
                </View>
                <Text style={{ flex: 1, color: c.t1, fontSize: 17, fontWeight: '800', textAlign }}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={c.t3} />
                </Pressable>
              </View>

              {fields.map((f) => (
                <View key={f.key} style={{ gap: 6, marginTop: 12 }}>
                  <Text style={{ color: c.t3, fontSize: 12, fontWeight: '600', textAlign }}>{f.label}</Text>
                  <View style={[S.inputRow, { backgroundColor: c.bg3, borderColor: c.b1, flexDirection: rowDir }]}>
                    <TextInput
                      value={values[f.key] ?? ''}
                      onChangeText={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={c.t4}
                      keyboardType={f.numeric ? 'numeric' : 'default'}
                      style={{ flex: 1, color: c.t1, fontSize: 16, fontWeight: '600', textAlign, padding: 0 }}
                    />
                    {f.suffix ? <Text style={{ color: c.t3, fontSize: 13, fontWeight: '600' }}>{f.suffix}</Text> : null}
                  </View>
                </View>
              ))}

              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                style={[S.submit, { backgroundColor: canSubmit ? c.accent : c.b2, opacity: canSubmit ? 1 : 0.6 }]}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{submitLabel}</Text>
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
  inputRow: { alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 52 },
  submit: { marginTop: 18, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
