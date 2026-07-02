// components/layout/Header.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';
import { type as T } from '@/tokens/typography';

interface Action {
  icon: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}
interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: Action[];
  left?: Action[];
  accent?: string;
}

export const Header = ({ title, subtitle, back = true, right = [], left = [], accent }: Props) => {
  const { c } = useTheme();
  const { isRTL } = useRTL();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={[S.bar, { paddingTop: top + 10, backgroundColor: c.bg0, borderBottomColor: c.b0 }]}
    >
      <View style={S.side}>
        {back && router.canGoBack() && (
          <Pressable onPress={() => router.back()} style={S.btn}>
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={accent ?? c.accent}
            />
          </Pressable>
        )}
        {left.map((a, i) => (
          <ActionBtn key={i} a={a} c={c} />
        ))}
      </View>
      <View style={S.mid}>
        <Text style={[S.title, { color: c.t1 }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[S.sub, { color: c.t2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[S.side, { justifyContent: 'flex-end' }]}>
        {right.map((a, i) => (
          <ActionBtn key={i} a={a} c={c} />
        ))}
      </View>
    </View>
  );
};

const ActionBtn = ({ a, c }: { a: Action; c: ReturnType<typeof useTheme>['c'] }) => (
  <Pressable onPress={a.onPress} style={[S.btn, { position: 'relative' }]}>
    <Ionicons name={a.icon as any} size={22} color={a.color ?? c.t2} />
    {!!a.badge && a.badge > 0 && (
      <View style={[S.badge, { backgroundColor: c.red }]}>
        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>
          {a.badge > 9 ? '9+' : a.badge}
        </Text>
      </View>
    )}
  </Pressable>
);

const S = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { flexDirection: 'row', width: 84, alignItems: 'center' },
  mid: { flex: 1, alignItems: 'center' },
  title: { ...T.title },
  sub: { ...T.caption, marginTop: 2 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  badge: {
    position: 'absolute',
    top: 4,
    end: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
