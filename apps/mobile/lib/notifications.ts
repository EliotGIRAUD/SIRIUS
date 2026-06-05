import Constants from 'expo-constants';

/** Les push distantes Android ne fonctionnent plus dans Expo Go (SDK 53+). */
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
      content: { title: 'SIRIUS', body: 'Pensez aux repas et à la balade de votre chien !' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
    });
  } catch {
    // noop
  }
}
