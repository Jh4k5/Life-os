// hooks/useHaptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useHaptics = () => {
  const safe = (fn: () => Promise<void>) => {
    if (Platform.OS === 'web') return;
    fn().catch(() => {});
  };
  return {
    light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    select: () => safe(() => Haptics.selectionAsync()),
    success: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    warning: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
    error: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  };
};
