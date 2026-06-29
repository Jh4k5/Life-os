// components/ui/Button.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  color?: string;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({
  label,
  onPress,
  variant = 'solid',
  color,
  icon,
  loading,
  disabled,
  style,
}: Props) => {
  const { c } = useTheme();
  const tone = color ?? c.accent;

  const bg =
    variant === 'solid'
      ? tone
      : variant === 'soft'
        ? tone + '20'
        : 'transparent';
  const borderColor = variant === 'outline' ? tone + '55' : 'transparent';
  const textColor = variant === 'solid' ? '#FFF' : tone;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        S.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={18} color={textColor} />}
          <Text style={[S.txt, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const S = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  txt: { fontSize: 16, fontWeight: '700' },
});
