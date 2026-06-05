import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/useAppStore';

export default function Index() {
  const { user, isBootstrapped } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!isBootstrapped || showSplash) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>SIRIUS</Text>
        <Text style={styles.tag}>Simulation adoption 30 jours</Text>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!user || user.role !== 'adopter') return <Redirect href="/(auth)/login" />;
  if (!user.emailVerified) return <Redirect href="/(auth)/verify-email" />;
  if (!user.onboardingCompleted) return <Redirect href="/(onboarding)/slides" />;
  return <Redirect href="/(adopter)/home" />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb' },
  logo: { fontSize: 42, fontWeight: '900', color: '#fff' },
  tag: { color: '#dbeafe', marginTop: 8 },
});
