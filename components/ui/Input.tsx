// components/ui/Input.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRTL } from '@/hooks/useRTL';

interface Props extends TextInputProps {
  label?: string;
  multiline?: boolean;
}

export const Input = ({ label, multiline, style, ...rest }: Props) => {
  const { c } = useTheme();
  const { textAlign } = useRTL();
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={[S.label, { color: c.t2 }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.t4}
        style={[
          S.input,
          {
            backgroundColor: c.bg2,
            borderColor: c.b1,
            color: c.t1,
            textAlign,
            height: multiline ? 120 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
};

const S = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
