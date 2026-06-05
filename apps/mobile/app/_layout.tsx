import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { restoreSession } from '../lib/session';
import { flushQueue } from '../lib/offline';
import { useAuthStore } from '../stores/useAppStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);

  useEffect(() => {
    (async () => {
      await restoreSession();
      await flushQueue().catch(() => {});
      setBootstrapped(true);
      setReady(true);
    })();
  }, [setBootstrapped]);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
