import { api, getToken, setToken, clearToken } from './api';
import { useAuthStore } from '../stores/useAppStore';

export interface UserProfile {
  id: string;
  email: string;
  role: 'adopter' | 'shelter';
  displayName: string;
  pseudo?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  settings?: Record<string, boolean>;
}

export async function restoreSession(): Promise<UserProfile | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const data = await api<{ user: UserProfile; token?: string }>('/auth/me');
    useAuthStore.getState().setAuth(token, {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      displayName: data.user.displayName,
      pseudo: data.user.pseudo,
      emailVerified: data.user.emailVerified,
      onboardingCompleted: data.user.onboardingCompleted,
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
