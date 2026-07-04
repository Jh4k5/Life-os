// app/settings/subscription.tsx
// Honest subscription state. Billing (RevenueCat + store products) is a later
// phase, so this screen shows the real current plan and previews the planned
// tiers — never a fake "buy" button that does nothing.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/layout/Header';
import { SmartCard } from '@/components/ui/SmartCard';

const PLANS = [
  { name: 'شهري', price: '5.99$', per: '/ شهر' },
  { name: '6 أشهر', price: '29.99$', per: '/ 6 أشهر', note: 'وفّر ~17%' },
  { name: 'سنوي', price: '49.99$', per: '/ سنة', note: 'أفضل قيمة' },
];

export default function SubscriptionScreen() {
  const { c } = useTheme();
  return (
    <View style={[S.screen, { backgroundColor: c.bg0 }]}>
      <Header title="الاشتراك" accent={c.habits} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        <SmartCard accent={c.green}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="checkmark-circle" size={22} color={c.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 15 }}>خطتك الحالية: تجربة مجانية</Text>
              <Text style={{ color: c.t2, fontSize: 13, marginTop: 2 }}>كل الميزات مفتوحة أثناء التجربة.</Text>
            </View>
          </View>
        </SmartCard>

        <Text style={{ color: c.t2, fontSize: 13, fontWeight: '700' }}>الخطط القادمة</Text>
        {PLANS.map((p) => (
          <View key={p.name} style={[S.plan, { backgroundColor: c.bg1, borderColor: c.b1 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.t1, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
              {p.note ? <Text style={{ color: c.green, fontSize: 12, marginTop: 2 }}>{p.note}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: c.t1, fontWeight: '800', fontSize: 16 }}>{p.price}</Text>
              <Text style={{ color: c.t3, fontSize: 11 }}>{p.per}</Text>
            </View>
          </View>
        ))}

        <Text style={{ color: c.t3, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          الدفع والاشتراك الفعلي قيد التجهيز — ستتمكن من الاشتراك واستعادة المشتريات قريبًا.
        </Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
});
