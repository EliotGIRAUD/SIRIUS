import { create } from 'zustand';
import type { Gauges } from '@sirius/shared';

export interface UserInfo {
  id: string;
  email: string;
  role: 'adopter' | 'shelter';
  displayName: string;
  pseudo?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  settings?: {
    soundsEnabled?: boolean;
    hapticsEnabled?: boolean;
    notificationsEnabled?: boolean;
    gpsEnabled?: boolean;
  };
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  spaCode: string | null;
  isBootstrapped: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  setSpaCode: (code: string) => void;
  setBootstrapped: (v: boolean) => void;
  clearAuth: () => void;
}

interface SimulationState {
  currentDay: number;
  budgetRemaining: number;
  gauges: Gauges;
  status: string;
  finalScore: number;
  streak: number;
  healthState: string;
  dogName: string;
  alerts: Array<{ type: string; message: string }>;
  cooldowns: Record<string, number>;
  setStatus: (payload: Partial<SimulationState>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  spaCode: null,
  isBootstrapped: false,
  setAuth: (token, user) => set({ token, user }),
  setSpaCode: (code) => set({ spaCode: code }),
  setBootstrapped: (v) => set({ isBootstrapped: v }),
  clearAuth: () => set({ token: null, user: null, spaCode: null }),
}));

export const useSimulationStore = create<SimulationState>((set) => ({
  currentDay: 1,
  budgetRemaining: 450,
  gauges: { hunger: 80, energy: 80, hygiene: 80, mental: 80 },
  status: 'in_progress',
  finalScore: 100,
  streak: 0,
  healthState: 'happy',
  dogName: '',
  alerts: [],
  cooldowns: {},
  setStatus: (payload) => set((s) => ({ ...s, ...payload })),
}));
