// components/ui/SmartCard.tsx
// Restrained surface: hairline border + frosted glass (dark), clean white (light).
// No colored card borders, no heavy drop shadows — depth via lines & translucency.
import React from 'react';
import { View, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Optional accent — rendered ONLY as a subtle tint, never a loud border. */
  accent?: string;
  elevated?: boolean;
  noPad?: boolean;
  padSize?: 'sm' | 'md' | 'lg';
  radius?: number;
}

export const SmartCard = ({
  children,
  style,
  accent,
  elevated,
  noPad,
  padSize = 'md',
  radius = 20,
}: Props) => {
  const { isDark, c } = useTheme();
  const padMap = { sm: 12, md: 16, lg: 22 };
  const pad = noPad ? 0 : padMap[padSize];
  // Hairline border — single restrained look regardless of section.
  const border = c.b1;

  if (!isDark) {
    return (
      <View
        style={[
          {
            backgroundColor: c.bg1,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: border,
            padding: pad,
            marginVertical: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 1,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            backgroundColor: elevated ? c.bg2 : c.bg1,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: border,
            padding: pad,
            marginVertical: 5,
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
      style={[{ borderRadius: radius, overflow: 'hidden', marginVertical: 5 }, style]}
    >
      <BlurView
        intensity={elevated ? 40 : 22}
        tint="dark"
        style={{
          backgroundColor: c.glass,
          borderRadius: radius,
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
