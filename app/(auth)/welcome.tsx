// app/(auth)/welcome.tsx
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);

  const slides = [
    { emoji: '🎤', title: t('auth.slide1_title'), desc: t('auth.slide1_desc'), color: c.accent },
    { emoji: '🧩', title: t('auth.slide2_title'), desc: t('auth.slide2_desc'), color: c.habits },
    { emoji: '🌱', title: t('auth.slide3_title'), desc: t('auth.slide3_desc'), color: c.areas },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (page < slides.length - 1) ref.current?.scrollTo({ x: (page + 1) * width, animated: true });
    else router.replace('/(auth)/sign-up');
  };

  return (
    <View style={[S.screen, { backgroundColor: c.bg0, paddingTop: top }]}>
      <Pressable onPress={() => router.replace('/(tabs)/home')} style={[S.skip, { top: top + 8 }]}>
        <Text style={{ color: c.t3, fontSize: 14 }}>{t('auth.skip')}</Text>
      </Pressable>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => (
          <View key={i} style={[S.slide, { width }]}>
            <View style={[S.emojiCircle, { backgroundColor: s.color + '20', borderColor: s.color + '40' }]}>
              <Text style={{ fontSize: 72 }}>{s.emoji}</Text>
            </View>
            <Text style={[S.title, { color: c.t1 }]}>{s.title}</Text>
            <Text style={[S.desc, { color: c.t2 }]}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[S.footer, { paddingBottom: bottom + 16 }]}>
        <View style={S.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                S.dot,
                { backgroundColor: i === page ? c.accent : c.b2, width: i === page ? 22 : 8 },
              ]}
            />
          ))}
        </View>
        <Button label={page === slides.length - 1 ? t('auth.get_started') : t('common.done')} onPress={next} />
        <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ color: c.t2, fontSize: 14 }}>
            {t('auth.have_account')} <Text style={{ color: c.accent, fontWeight: '700' }}>{t('auth.sign_in')}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  skip: { position: 'absolute', end: 20, zIndex: 10, padding: 8 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 24 },
  emojiCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
