// app/(tabs)/more/dopamine/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';
import { mockDopamine } from '@/data/mock';

const RANKS = [
  { min: 0, max: 99, tkey: 'dopamine.rank_rookie' },
  { min: 100, max: 299, tkey: 'dopamine.rank_aware' },
  { min: 300, max: 699, tkey: 'dopamine.rank_disc' },
  { min: 700, max: 1499, tkey: 'dopamine.rank_master' },
  { min: 1500, max: Infinity, tkey: 'dopamine.rank_lord' },
];

export default function DopamineScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const [activities, setActivities] = useState(mockDopamine.activities);
  const [challenges, setChallenges] = useState(mockDopamine.challenges);

  const rank = RANKS.find((r) => mockDopamine.totalXP >= r.min && mockDopamine.totalXP <= r.max) ?? RANKS[0];
  const next = RANKS[RANKS.indexOf(rank) + 1];
  const rankProg = next ? (mockDopamine.totalXP - rank.min) / (next.min - rank.min) : 1;

  const toggleActivity = (id: string) =>
    setActivities((p) => p.map((a) => (a.id === id ? { ...a, logged: !a.logged } : a)));
  const acceptChallenge = (id: string) =>
    setChallenges((p) => p.map((ch) => (ch.id === id ? { ...ch, active: !ch.active } : ch)));

  const maxAbs = Math.max(...mockDopamine.weekProgress.map((v) => Math.abs(v)), 1);

  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header
        title={t('sections.dopamine')}
        accent={c.dopamine}
        right={[{ icon: 'add', onPress: () => {}, color: c.accent }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 110 }}>
        {/* Rank + XP */}
        <SmartCard accent={c.dopamine} elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[S.xpRing, { borderColor: c.dopamine, backgroundColor: c.dopamine + '18' }]}>
              <Text style={{ color: c.dopamine, fontWeight: '800', fontSize: 20 }}>{mockDopamine.totalXP}</Text>
              <Text style={{ color: c.t3, fontSize: 10 }}>XP</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 18 }}>{t(rank.tkey)}</Text>
              {next && (
                <>
                  <View style={[S.pBg, { backgroundColor: c.b1, marginTop: 8 }]}>
                    <View style={[S.pFill, { width: `${rankProg * 100}%`, backgroundColor: c.dopamine }]} />
                  </View>
                  <Text style={{ color: c.t3, fontSize: 11, marginTop: 4 }}>
                    {next.min - mockDopamine.totalXP} XP للرتبة التالية
                  </Text>
                </>
              )}
            </View>
          </View>
        </SmartCard>

        {/* Week chart */}
        <Text style={[S.label, { color: c.t2 }]}>{t('dopamine.weekly')}</Text>
        <SmartCard>
          <View style={S.chart}>
            {mockDopamine.weekProgress.map((v, i) => (
              <View key={i} style={S.chartCol}>
                <View style={S.barArea}>
                  {v >= 0 ? (
                    <View
                      style={[
                        S.bar,
                        { height: `${(Math.abs(v) / maxAbs) * 50}%`, backgroundColor: c.green, alignSelf: 'flex-end' },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        S.bar,
                        { height: `${(Math.abs(v) / maxAbs) * 50}%`, backgroundColor: c.red, marginTop: '50%' },
                      ]}
                    />
                  )}
                </View>
                <Text style={{ color: v >= 0 ? c.green : c.red, fontSize: 10, fontWeight: '700' }}>{v > 0 ? `+${v}` : v}</Text>
              </View>
            ))}
          </View>
        </SmartCard>

        {/* Activities */}
        <Text style={[S.label, { color: c.t2 }]}>{t('dopamine.activities')}</Text>
        {activities.map((a) => (
          <Pressable key={a.id} onPress={() => toggleActivity(a.id)}>
            <SmartCard accent={a.type === 'healthy' ? c.green : c.red} padSize="sm">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={[
                    S.actIcon,
                    { backgroundColor: (a.type === 'healthy' ? c.green : c.red) + '20' },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.t1, fontWeight: '600', fontSize: 15 }}>{a.name}</Text>
                  <Text style={{ color: a.type === 'healthy' ? c.green : c.red, fontSize: 12, marginTop: 2 }}>
                    {a.type === 'healthy' ? t('dopamine.healthy') : t('dopamine.addictive')} · {a.xp > 0 ? `+${a.xp}` : a.xp} XP
                  </Text>
                </View>
                <View
                  style={[
                    S.logBtn,
                    {
                      backgroundColor: a.logged ? (a.type === 'healthy' ? c.green : c.red) : 'transparent',
                      borderColor: a.type === 'healthy' ? c.green : c.red,
                    },
                  ]}
                >
                  <Text style={{ color: a.logged ? '#FFF' : a.type === 'healthy' ? c.green : c.red, fontSize: 12, fontWeight: '700' }}>
                    {a.logged ? '✓' : '+'}
                  </Text>
                </View>
              </View>
            </SmartCard>
          </Pressable>
        ))}

        {/* Challenges */}
        <Text style={[S.label, { color: c.t2 }]}>{t('dopamine.challenges')}</Text>
        {challenges.map((ch) => (
          <SmartCard key={ch.id} accent={c.dopamine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 26 }}>{ch.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.t1, fontWeight: '600', fontSize: 14 }}>{ch.title}</Text>
                <Text style={{ color: c.dopamine, fontSize: 12, marginTop: 2 }}>
                  🏆 {ch.reward} XP · {ch.days} أيام
                </Text>
              </View>
              <Pressable
                onPress={() => acceptChallenge(ch.id)}
                style={[
                  S.acceptBtn,
                  { backgroundColor: ch.active ? c.dopamine : 'transparent', borderColor: c.dopamine },
                ]}
              >
                <Text style={{ color: ch.active ? '#FFF' : c.dopamine, fontWeight: '600', fontSize: 13 }}>
                  {ch.active ? t('dopamine.accepted') : t('dopamine.accept')}
                </Text>
              </Pressable>
            </View>
          </SmartCard>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  xpRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  pBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: 6, borderRadius: 3 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'stretch', gap: 6 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  barArea: { flex: 1, width: '100%', justifyContent: 'center' },
  bar: { width: '70%', borderRadius: 4, alignSelf: 'center' },
  actIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  logBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
});
