// services/notifications.ts
// Proactive, contextual reminders. Real local-notification seam (works on
// device; safely no-ops on web). Later this is paired with server-scheduled
// push for cross-device nudges. The voice/tone stays human, never an alarm.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Show reminders even when the app is foregrounded (e.g. a Focus phase ends
// while the running screen is open) — otherwise the banner is swallowed.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const notifications = {
  async ensurePermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  },

  /** Schedule a contextual, human reminder at a future date. */
  async scheduleReminder(title: string, body: string, date: Date): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (!(await this.ensurePermission())) return null;
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  },

  /** Contextual nudge a few minutes from now (e.g. "appointment in 30 min"). */
  async nudgeIn(minutes: number, title: string, body: string): Promise<string | null> {
    return this.scheduleReminder(title, body, new Date(Date.now() + minutes * 60_000));
  },

  async cancelAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
