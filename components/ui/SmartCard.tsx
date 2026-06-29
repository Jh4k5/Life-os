// components/ui/SmartCard.tsx
import React from 'react';
import { View, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string; // لون border مميز
  elevated?: boolean;
  noPad?: boolean;
  padSize?: 'sm' | 'md' | 'lg';
}

export const SmartCard = ({ children, style, accent, elevated, noPad, padSize = 'md' }: Props) => {
  const { isDark, c } = useTheme();
  const padMap = { sm: 10, md: 16, lg: 22 };
  const pad = noPad ? 0 : padMap[padSize];
  const border = accent ? accent + '55' : c.b1;

  // Light mode → بطاقة بيضاء نظيفة مع ظل ناعم
  if (!isDark) {
    return (
      <View
        style={[
          {
            backgroundColor: elevated ? c.bg1 : c.bg1,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: border,
            padding: pad,
            marginVertical: 4,
            shadowColor: accent ?? '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Dark mode → زجاج سائل
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            backgroundColor: c.glass,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: border,
            padding: pad,
            marginVertical: 4,
          } as ViewStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        { borderRadius: 18, overflow: 'hidden', marginVertical: 4 },
        style,
      ]}
    >
      <BlurView
        intensity={elevated ? 55 : 35}
        tint="dark"
        style={{
          backgroundColor: c.glass,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: border,
          padding: pad,
        }}
      >
        {children}
      </BlurView>
    </View>
  );
};
