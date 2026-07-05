// services/feedback.ts
// One tactile + audible voice for the whole app. Every meaningful action gets a
// short, tasteful haptic and (optionally) a soft sound, so the product feels
// physical and alive — like a premium OS, never a silent web page. Centralized
// so we can tune the whole feel from one place and honor the user's
// Haptics/Sounds toggles.
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

const hapticsOn = () => {
  try {
    return useSettingsStore.getState().haptics !== false;
  } catch {
    return true;
  }
};
const runHaptic = (fn: () => Promise<unknown>) => {
  if (!hapticsOn()) return;
  fn().catch(() => {
    /* haptics must never break an interaction */
  });
};

// Sound playback is intentionally deferred: expo-audio@1.1.1 references a
// native class (AnyTypeCache) that SDK 54's expo-modules-core lacks, crashing
// launch. The `sounds` toggle stays in Settings so re-enabling audio later
// (once a compatible module is aligned) is a one-line change here. For now the
// tactile layer (haptics) carries the "alive" feel.
function playSound(_name: 'tap' | 'success' | 'celebrate') {
  /* no-op until a launch-safe audio module is wired */
}

export const feedback = {
  /** Light tap — a button/card press. */
  tap() {
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** Medium press — a confirming action (add, toggle on). */
  press() {
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    playSound('tap');
  },
  /** Selection change — pickers, segmented controls, tab switch. */
  select() {
    runHaptic(() => Haptics.selectionAsync());
  },
  /** Something succeeded — saved, applied, completed. */
  success() {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    playSound('success');
  },
  /** A soft warning — overdue, streak at risk, validation. */
  warning() {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  /** An error — failed action. */
  error() {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  /** A milestone — streak hit, goal done. A celebratory double-beat. */
  celebrate() {
    if (hapticsOn()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 90);
    }
    playSound('celebrate');
  },
};
