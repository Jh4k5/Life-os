// services/feedback.ts
// One tactile + audible voice for the whole app. Every meaningful action gets a
// short, tasteful haptic and (optionally) a soft sound, so the product feels
// physical and alive — like a premium OS, never a silent web page. Centralized
// so we can tune the whole feel from one place and honor the user's
// Haptics/Sounds toggles.
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '@/store/settingsStore';

const hapticsOn = () => {
  try {
    return useSettingsStore.getState().haptics !== false;
  } catch {
    return true;
  }
};
const soundsOn = () => {
  try {
    return useSettingsStore.getState().sounds !== false;
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

// ── soft, musical UI sounds (soft attack + exponential decay, not beeps) ──
type SoundName = 'tap' | 'success' | 'celebrate';
const SOURCES: Record<SoundName, number> = {
  tap: require('../assets/sounds/tap.wav'),
  success: require('../assets/sounds/success.wav'),
  celebrate: require('../assets/sounds/celebrate.wav'),
};
const players: Partial<Record<SoundName, AudioPlayer>> = {};

function playSound(name: SoundName) {
  if (!soundsOn()) return;
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    p.seekTo(0);
    p.play();
  } catch {
    /* audio is a nicety — never let it break the interaction */
  }
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
