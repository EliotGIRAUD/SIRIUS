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
  const isUsableEnv =
    envUrl &&
    !envUrl.includes('x.x') &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1');

  if (isUsableEnv) return envUrl;

  const devHost = getDevHost();
  if (devHost) return `http://${devHost}:3001`;

  return 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

export const WEB_PRO_URL = process.env.EXPO_PUBLIC_WEB_PRO_URL || 'http://localhost:5173';
