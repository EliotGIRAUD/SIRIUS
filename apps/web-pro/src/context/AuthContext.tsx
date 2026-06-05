import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearToken, fetchMe, loginRequest, saveToken, setUnauthorizedHandler } from '../lib/api';
import type { AuthUser, BreederInfo, ShelterInfo } from '../lib/types';

interface AuthState {
  user: AuthUser | null;
  shelter: ShelterInfo | null;
  breeder: BreederInfo | null;
  isBootstrapped: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shelter, setShelter] = useState<ShelterInfo | null>(null);
  const [breeder, setBreeder] = useState<BreederInfo | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setShelter(null);
    setBreeder(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('sirius_token');
    if (!token) {
      logout();
      return;
    }
    const data = await fetchMe();
    setUser(data.user);
    setShelter(data.shelter ?? null);
    setBreeder(data.breeder ?? null);
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    refresh()
      .catch(() => logout())
      .finally(() => setIsBootstrapped(true));
  }, [logout, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    saveToken(data.token);
    setUser(data.user);
    setShelter(data.shelter ?? null);
    setBreeder(data.breeder ?? null);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, shelter, breeder, isBootstrapped, login, logout, refresh }),
    [user, shelter, breeder, isBootstrapped, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
