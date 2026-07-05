// lib/textScale.ts
// Makes Settings → Font size actually scale text app-wide. Rather than thread a
// multiplier through hundreds of components, we patch the base RN <Text> (and
// <TextInput>) render once at startup so every rendered fontSize is multiplied
// by the user's chosen scale. The scale is read live from the settings store,
// so a change takes effect on the next render (the root re-keys on change).
import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

export const FONT_SCALE: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 0.9,
  md: 1,
  lg: 1.15,
  xl: 1.3,
};

const currentScale = () => FONT_SCALE[useSettingsStore.getState().fontSize] ?? 1;

function patch(Comp: any) {
  if (!Comp || Comp.__lifeosScaled) return;
  const orig = Comp.render;
  if (typeof orig !== 'function') return;
  Comp.__lifeosScaled = true;
  Comp.render = function (...args: any[]) {
    const el = orig.apply(this, args);
    const scale = currentScale();
    if (scale === 1 || !el) return el;
    const flat = StyleSheet.flatten(el.props?.style) || {};
    const base = typeof (flat as any).fontSize === 'number' ? (flat as any).fontSize : 14;
    return React.cloneElement(el, {
      style: [el.props.style, { fontSize: Math.round(base * scale) }],
    });
  };
}

/** Patch once at app startup. Idempotent. */
export function installTextScaling() {
  patch(Text);
  patch(TextInput);
}
