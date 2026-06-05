import { api, getToken, setToken, clearToken } from './api';
import { useAuthStore } from '../stores/useAppStore';
import type { UserInfo } from '../stores/useAppStore';

export async function restoreSession(): Promise<UserInfo | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const data = await api<{ user: UserInfo }>('/auth/me');
    if (data.user.role !== 'adopter') {
      await clearToken();
      useAuthStore.getState().clearAuth();
      return null;
    }
    useAuthStore.getState().setAuth(token, {
      id: String(data.user.id),
      email: data.user.email,
      role: data.user.role,
      displayName: data.user.displayName,
      pseudo: data.user.pseudo,
      emailVerified: data.user.emailVerified,
      onboardingCompleted: data.user.onboardingCompleted,
      plan: data.user.plan || 'free',
      ownedBreeds: data.user.ownedBreeds || ['labrador'],
      purchases: data.user.purchases || [],
      settings: data.user.settings,
    });
    return data.user;
  } catch {
    await clearToken();
    useAuthStore.getState().clearAuth();
    return null;
  }
}

export async function logout() {
  await clearToken();
  useAuthStore.getState().clearAuth();
}
