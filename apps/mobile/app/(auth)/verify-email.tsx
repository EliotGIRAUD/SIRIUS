import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/useAppStore';
import { CodeInput } from '../../components/ui/CodeInput';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await api<{ user: NonNullable<typeof user> }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, code }),
      });
      if (token) setAuth(token, data.user);
      router.replace('/(onboarding)/slides');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification email</Text>
      <Text style={styles.sub}>Code envoyé à {user?.email}</Text>
      <Text style={styles.hint}>Dev : 123456</Text>
      <CodeInput value={code} onChange={setCode} />
      <Button label="Vérifier" onPress={verify} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted },
  hint: { color: colors.warning, marginBottom: 8 },
});
