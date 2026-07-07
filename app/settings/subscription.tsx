// app/settings/subscription.tsx
// Honest subscription state. Billing (RevenueCat + store products) is a later
// phase, so this screen shows the real current plan and previews the planned
// tiers — never a fake "buy" button that does nothing.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';

export default function SubscriptionScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { rowDir, textAlign } = useRTL();
  const PLANS = [
    { name: t('subscription.monthly'), price: '5.99$', per: t('subscription.per_month') },
    { name: t('subscription.half_year'), price: '29.99$', per: t('subscription.per_half'), note: t('subscription.save17') },
    { name: t('subscription.yearly'), price: '49.99$', per: t('subscription.per_year'), note: t('subscription.best') },
  ];
  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title={t('subscription.title')} accent={c.habits} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        <SmartCard accent={c.green}>
          <View style={{ flexDirection: rowDir, alignItems: 'center', gap: 10 }}>
            <Ionicons name="checkmark-circle" size={22} color={c.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15, textAlign }}>{t('subscription.current')}</Text>
              <Text style={{ color: c.t2, fontSize: 13, marginTop: 2, textAlign }}>{t('subscription.all_open')}</Text>
            </View>
          </View>
        </SmartCard>

        <Text style={{ color: c.t2, fontSize: 13, fontWeight: '700', textAlign }}>{t('subscription.upcoming')}</Text>
        {PLANS.map((p) => (
          <View key={p.name} style={[S.plan, { backgroundColor: c.bg1, borderColor: c.b1, flexDirection: rowDir }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15, textAlign }}>{p.name}</Text>
              {p.note ? <Text style={{ color: c.green, fontSize: 12, marginTop: 2, textAlign }}>{p.note}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 16 }}>{p.price}</Text>
              <Text style={{ color: c.t3, fontSize: 11 }}>{p.per}</Text>
            </View>
          </View>
        ))}

        <Text style={{ color: c.t3, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          {t('subscription.note')}
        </Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
});
