import Constants from 'expo-constants';

function getDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];

  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) return debuggerHost.split(':')[0];

  return null;
}

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  const devHost = getDevHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:3001`;
  }

  return 'http://localhost:3001';
}

/** Résolu à l'appel (pas au chargement du module) pour Expo Go sur téléphone. */
export function getApiUrl(): string {
  return resolveApiUrl();
}

/** @deprecated Préférer getApiUrl() — conservé pour affichage statique */
export const API_URL = resolveApiUrl();

export function getWebProUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_WEB_PRO_URL?.trim();
  if (envUrl) return envUrl;

  const devHost = getDevHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:5173`;
  }

  return 'http://localhost:5173';
}

export const WEB_PRO_URL = getWebProUrl();
