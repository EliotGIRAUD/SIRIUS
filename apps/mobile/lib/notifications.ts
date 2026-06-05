import Constants from 'expo-constants';
import { getApiUrl } from './config';

let Notifications: typeof import('expo-notifications') | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Audio: any = null;

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

async function loadNotifications() {
  if (isExpoGo()) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function playBark() {
  try {
    if (!Audio) {
      try {
        Audio = (await import('expo-av')).Audio;
      } catch {
        return;
      }
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Pas d'asset — vibration haptique fallback via notification sound default
  } catch {
    // noop
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo()) return true;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyReminders(enabled: boolean) {
  if (isExpoGo() || !enabled) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'SIRIUS 🐕', body: 'Ouaf ! Pensez aux repas et à la balade.', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
    });
  } catch {
    // noop
  }
}

export async function scheduleContextualReminders(token: string, soundsEnabled = true) {
  if (isExpoGo()) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const res = await fetch(`${getApiUrl()}/simulation/status`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return;
    const data = await res.json();
    const alerts = data.alerts || [];
    for (const alert of alerts.slice(0, 2)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SIRIUS',
          body: alert.message,
          sound: soundsEnabled,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 },
      });
    }
    if (soundsEnabled) await playBark();
  } catch {
    // noop
  }
}
