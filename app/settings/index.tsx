// app/settings/index.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { accentPresets } from '@/tokens/colors';
import { LANGS, changeLang } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { auth } from '@/services/auth';
import { useProfileStore } from '@/store/profileStore';
import * as db from '@/db/local';
import { feedback } from '@/services/feedback';

export default function SettingsScreen() {
  const { c, isDark, mode, setMode, accent, setAccent } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { fontSize, setFontSize, density, setDensity, haptics, setHaptics, sounds, setSounds } = useSettingsStore();
  const profileName = useProfileStore((s) => s.name);
  const resetProfile = useProfileStore((s) => s.reset);

  const exportData = async () => {
    try {
      const snapshot = await db.exportAll();
      await Share.share({ message: JSON.stringify(snapshot, null, 2) }, { dialogTitle: t('settings.export_dialog') });
    } catch {
      /* user cancelled the share sheet */
    }
  };

  const confirmDelete = () => {
    // Real deletion, guarded by an explicit double-confirm.
    Alert.alert(
      t('settings.delete_title'),
      t('settings.delete_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.delete_confirm'),
          style: 'destructive',
          onPress: async () => {
            await auth.deleteAccount(); // server delete (best-effort) + sign out
            await db.clearAll(); // wipe every local collection
            resetProfile();
            feedback.warning();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  const Row = ({ icon, label, value, onPress, iconColor }: any) => (
    <Pressable onPress={onPress} style={[S.row, { borderBottomColor: c.b0 }]}>
      <View style={[S.rowIcon, { backgroundColor: (iconColor ?? c.accent) + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? c.accent} />
      </View>
      <Text numberOfLines={1} style={[S.rowLabel, { color: c.t1 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={{ color: c.t3, fontSize: 14 }}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={c.t3} />
      </View>
    </Pressable>
  );

  const Toggle = ({ icon, label, value, onToggle, iconColor }: any) => (
    <Pressable
      onPress={() => {
        onToggle(!value);
        feedback.tap();
      }}
      style={[S.row, { borderBottomColor: c.b0 }]}
    >
      <View style={[S.rowIcon, { backgroundColor: (iconColor ?? c.accent) + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? c.accent} />
      </View>
      <Text numberOfLines={1} style={[S.rowLabel, { color: c.t1 }]}>{label}</Text>
      <View style={[S.track, { backgroundColor: value ? c.green : c.b2 }]}>
        <View style={[S.knob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('settings.title')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 110 }}>
        {/* ── المظهر ── */}
        <Text style={[S.groupTitle, { color: c.t2 }]}>{t('settings.appearance')}</Text>
        <SmartCard>
          {/* الثيم */}
          <Text style={[S.cardLabel, { color: c.t1 }]}>{t('settings.theme')}</Text>
          <View style={S.threeRow}>
            {(
              [
                ['dark', '🌙', 'settings.dark'],
                ['light', '☀', 'settings.light'],
                ['system', '📱', 'settings.system'],
              ] as [ThemeMode, string, string][]
            ).map(([m, em, lbl]) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  S.themeBtn,
                  { backgroundColor: mode === m ? c.accent : c.bg3, borderColor: mode === m ? c.accent : c.b1 },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{em}</Text>
                <Text style={{ color: mode === m ? '#FFF' : c.t2, fontSize: 12, fontWeight: '600' }}>{t(lbl)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[S.div, { backgroundColor: c.b0 }]} />
          {/* لون النبرة */}
          <Text style={[S.cardLabel, { color: c.t1 }]}>{t('settings.accent')}</Text>
          <View style={S.accentGrid}>
            {accentPresets
              .filter((a) => a.id !== 'custom')
              .map((opt) => {
                const clr = isDark ? opt.dark : opt.light;
                const isActive = accent === clr;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setAccent(clr)}
                    style={[
                      S.accentDot,
                      {
                        backgroundColor: clr,
                        transform: [{ scale: isActive ? 1.25 : 1 }],
                        borderWidth: isActive ? 3 : 0,
                        borderColor: isDark ? '#FFF' : '#000',
                      },
                    ]}
                  />
                );
              })}
          </View>
          <View style={[S.div, { backgroundColor: c.b0 }]} />
          {/* حجم الخط */}
          <Text style={[S.cardLabel, { color: c.t1 }]}>{t('settings.font_size')}</Text>
          <View style={S.threeRow}>
            {(
              [
                ['sm', 'A', 'settings.font_sm'],
                ['md', 'AA', 'settings.font_md'],
                ['lg', 'AAA', 'settings.font_lg'],
              ] as const
            ).map(([k, sym, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setFontSize(k)}
                style={[
                  S.themeBtn,
                  { backgroundColor: fontSize === k ? c.accent : c.bg3, borderColor: fontSize === k ? c.accent : c.b1 },
                ]}
              >
                <Text style={{ color: fontSize === k ? '#FFF' : c.t1, fontSize: k === 'sm' ? 14 : k === 'md' ? 18 : 22, fontWeight: '700' }}>
                  {sym}
                </Text>
                <Text style={{ color: fontSize === k ? '#FFF' : c.t2, fontSize: 11 }}>{t(lbl)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[S.div, { backgroundColor: c.b0 }]} />
          {/* الكثافة */}
          <Text style={[S.cardLabel, { color: c.t1 }]}>{t('settings.density')}</Text>
          <View style={S.threeRow}>
            {(
              [
                ['compact', 'settings.compact'],
                ['default', 'settings.default'],
                ['spacious', 'settings.spacious'],
              ] as const
            ).map(([k, lbl]) => (
              <Pressable
                key={k}
                onPress={() => setDensity(k)}
                style={[
                  S.themeBtn,
                  { backgroundColor: density === k ? c.accent : c.bg3, borderColor: density === k ? c.accent : c.b1 },
                ]}
              >
                <Text style={{ color: density === k ? '#FFF' : c.t2, fontSize: 12, fontWeight: '600' }}>{t(lbl)}</Text>
              </Pressable>
            ))}
          </View>
        </SmartCard>

        {/* ── اللغة ── */}
        <Text style={[S.groupTitle, { color: c.t2 }]}>{t('settings.language')}</Text>
        <SmartCard>
          {LANGS.map((lang, idx) => (
            <Pressable
              key={lang.code}
              onPress={() => changeLang(lang.code)}
              style={[
                S.langRow,
                idx < LANGS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.b0 },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontSize: 15 }}>{lang.name}</Text>
                {lang.rtl && <Text style={{ color: c.t3, fontSize: 11, marginTop: 2 }}>{t('settings.rtl_hint')}</Text>}
              </View>
              {i18n.language === lang.code ? (
                <Ionicons name="checkmark-circle" size={22} color={c.accent} />
              ) : (
                <View style={[S.radioEmpty, { borderColor: c.b2 }]} />
              )}
            </Pressable>
          ))}
        </SmartCard>

        {/* ── الأصوات والإحساس ── */}
        <Text style={[S.groupTitle, { color: c.t2 }]}>{t('settings.sounds_section')}</Text>
        <SmartCard>
          <Toggle icon="phone-portrait-outline" label={t('settings.haptics')} value={haptics} onToggle={setHaptics} iconColor={c.accent} />
          <Toggle icon="volume-high-outline" label={t('settings.sounds')} value={sounds} onToggle={setSounds} iconColor={c.habits} />
        </SmartCard>

        {/* ── الحساب ── */}
        <Text style={[S.groupTitle, { color: c.t2 }]}>{t('settings.account')}</Text>
        <SmartCard>
          <Row icon="person-outline" label={t('settings.profile')} value={profileName || undefined} onPress={() => router.push('/settings/profile' as never)} iconColor={c.accent} />
          <Row icon="diamond-outline" label={t('settings.subscription')} value={t('settings.free_trial')} onPress={() => router.push('/settings/subscription' as never)} iconColor={c.habits} />
          <Row icon="download-outline" label={t('settings.export')} onPress={exportData} iconColor={c.tasks} />
          <Row
            icon="shield-checkmark-outline"
            label={t('settings.trust_center')}
            onPress={() => router.push('/trust-center')}
            iconColor={c.green}
          />
          <Row icon="trash-outline" label={t('settings.delete_account')} onPress={confirmDelete} iconColor={c.red} />
        </SmartCard>

        {/* Sign Out */}
        <Pressable
          onPress={async () => {
            await auth.signOut();
            await db.clearAll();
            resetProfile();
            router.replace('/(auth)/sign-in');
          }}
          style={[S.signOutBtn, { borderColor: c.red + '50' }]}
        >
          <Ionicons name="log-out-outline" size={20} color={c.red} />
          <Text numberOfLines={1} style={{ color: c.red, fontWeight: '600', fontSize: 16, flexShrink: 1 }}>{t('settings.sign_out')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  groupTitle: { fontSize: 13, fontWeight: '700', paddingStart: 4 },
  cardLabel: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  threeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  div: { height: 1, marginVertical: 14 },
  accentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingVertical: 4 },
  accentDot: { width: 34, height: 34, borderRadius: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  track: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  radioEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
