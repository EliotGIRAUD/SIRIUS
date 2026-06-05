import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const QUEUE_KEY = 'sirius_offline_queue';

interface QueuedAction {
  path: string;
  method: string;
  body: string;
}

export async function queueAction(path: string, method: string, body: object) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedAction[] = raw ? JSON.parse(raw) : [];
  queue.push({ path, method, body: JSON.stringify(body) });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const queue: QueuedAction[] = JSON.parse(raw);
  const remaining: QueuedAction[] = [];
  for (const item of queue) {
    try {
      await api(item.path, { method: item.method, body: item.body });
    } catch {
      remaining.push(item);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}
