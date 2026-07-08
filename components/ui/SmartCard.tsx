// components/ui/SmartCard.tsx
// Restrained surface: hairline border + frosted glass (dark), clean white (light).
// The dark surface is a real frosted-glass panel — blurred backdrop, a bright
// specular hairline along the top edge, and per-side borders that fade from a
// lit top to a shadowed bottom. Depth via light, not heavy drop shadows.
import React from 'react';
import { View, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useDensity } from '@/hooks/useDensity';

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

// A whisper of the section color, top-anchored, never a loud border.
const AccentTint = ({ accent, radius }: { accent: string; radius: number }) => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 64,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      backgroundColor: accent + '12',
    }}
  />
);

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
  const dens = useDensity();
  const padMap = { sm: 12, md: 16, lg: 22 };
  // Internal padding tracks the user's Layout-density preference so the whole
  // app breathes (spacious) or tightens (compact) with a single control.
  const pad = noPad ? 0 : Math.round(padMap[padSize] * dens);

  if (!isDark) {
    return (
      <View
        style={[
          {
            backgroundColor: c.bg1,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: c.b1,
            padding: pad,
            marginVertical: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 1,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {accent ? <AccentTint accent={accent} radius={radius} /> : null}
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
            borderColor: c.b1,
            padding: pad,
            marginVertical: 5,
            overflow: 'hidden',
          } as ViewStyle,
          style,
        ]}
      >
        {accent ? <AccentTint accent={accent} radius={radius} /> : null}
        {children}
      </View>
    );
  }

  // Dark: premium frosted glass. A brighter top border + a specular hairline
  // reads as light catching the top edge of a glass pane.
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', marginVertical: 5 }, style]}>
      <BlurView
        intensity={elevated ? 52 : 32}
        tint="dark"
        style={{
          backgroundColor: c.glass,
          borderRadius: radius,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.14)',
          borderLeftColor: 'rgba(255,255,255,0.06)',
          borderRightColor: 'rgba(255,255,255,0.06)',
          borderBottomColor: 'rgba(0,0,0,0.20)',
          padding: pad,
          overflow: 'hidden',
        }}
      >
        {/* Specular highlight — a faint bright line just inside the top edge. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: radius * 0.6,
            right: radius * 0.6,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.22)',
          }}
        />
        {accent ? <AccentTint accent={accent} radius={radius} /> : null}
        {children}
      </BlurView>
    </View>
  );
};
