// components/ui/EmojiPicker.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const PRESET_EMOJIS = [
  '⭐', '💧', '📖', '🏃', '🧘', '💊', '✍', '🎵', '💪', '🥗',
  '🌿', '📝', '🎯', '💡', '🌙', '☀', '🙏', '🎓', '🔢', '⏱',
  '🚶', '🏋', '📵', '📧', '🗣', '🎙', '⏰', '🚿', '🍬', '🚀',
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  color: string;
  emojis?: string[];
}

export const EmojiPicker = ({ value, onChange, color, emojis = PRESET_EMOJIS }: Props) => {
  const { c } = useTheme();
  return (
    <View style={S.grid}>
      {emojis.map((em) => (
        <Pressable
          key={em}
          onPress={() => onChange(em)}
          style={[
            S.btn,
            {
              backgroundColor: value === em ? color + '30' : c.bg2,
              borderColor: value === em ? color : c.b0,
              borderWidth: value === em ? 2 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 24 }}>{em}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const S = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
