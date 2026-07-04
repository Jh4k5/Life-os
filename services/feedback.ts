// services/feedback.ts
// One tactile voice for the whole app. Every meaningful action gets a short,
// tasteful haptic (and later a sound) so the product feels physical and alive —
// like a premium OS, never a silent web page. Centralized so we can tune the
// whole feel from one place and honor the user's Haptics/Sounds toggles.
//
// Haptics ship first (expo-haptics is already a dependency → no native-build
// risk). Sound playback is added behind the same API once a verified build
// confirms the audio module is safe.
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

const hapticsOn = () => {
  try {
    return useSettingsStore.getState().haptics !== false;
  } catch {
    return true;
  }
};

const run = (fn: () => Promise<unknown>) => {
  if (!hapticsOn()) return;
  fn().catch(() => {
    /* haptics must never break an interaction */
  });
};

export const feedback = {
  /** Light tap — a button/card press. */
  tap() {
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** Medium press — a confirming action (add, toggle on). */
  press() {
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  /** Selection change — pickers, segmented controls, tab switch. */
  select() {
    run(() => Haptics.selectionAsync());
  },
  /** Something succeeded — saved, applied, completed. */
  success() {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** A soft warning — overdue, streak at risk, validation. */
  warning() {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  /** An error — failed action. */
  error() {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  /** A milestone — streak hit, goal done. A celebratory double-beat. */
  celebrate() {
    if (!hapticsOn()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 90);
  },
};
