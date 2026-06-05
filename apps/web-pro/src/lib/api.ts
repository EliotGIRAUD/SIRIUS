import type { AuthUser, BreederInfo, ShelterInfo } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function getToken() {
  return localStorage.getItem('sirius_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('Session expirée');
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export function saveToken(token: string) {
  localStorage.setItem('sirius_token', token);
}

export function clearToken() {
  localStorage.removeItem('sirius_token');
}

export function getPdfUrl(clientId: string) {
  return `${API_URL}/pro/client/${clientId}/attestation.pdf`;
}

export async function downloadPdf(clientId: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/pro/client/${clientId}/attestation.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('PDF indisponible');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  shelter?: ShelterInfo | null;
  breeder?: BreederInfo | null;
}

export async function loginRequest(email: string, password: string) {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe() {
  return api<{ user: AuthUser; shelter?: ShelterInfo | null; breeder?: BreederInfo | null }>('/auth/me');
}
