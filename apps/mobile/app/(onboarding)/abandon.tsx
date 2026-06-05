import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

const STEPS = [
  'Abandonner un animal a des conséquences réelles sur sa santé mentale et physique.',
  'La simulation pénalise les négligences : budget, repas, balades, soins.',
  'Je m\'engage à mener la simulation jusqu\'au bout et à demander de l\'aide si nécessaire.',
];

export default function AbandonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ breedId: string; name: string; sccLetter: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    try {
      await api('/simulation/setup-dog', {
        method: 'POST',
        body: JSON.stringify({
          breedId: params.breedId,
          name: params.name,
          sccLetter: params.sccLetter,
          moralContractSigned: true,
          abandonmentProtocolCompleted: true,
        }),
      });
      const me = await api<{ user: NonNullable<typeof user> }>('/auth/onboarding-complete', {
        method: 'PATCH',
        body: JSON.stringify({ settings: { gpsEnabled: true, notificationsEnabled: true } }),
      });
      if (token && me.user) setAuth(token, me.user);
      await api('/simulation/start', { method: 'POST' }).catch(() => {});
      router.replace('/(adopter)/home');
    } catch (e) {
      console.error(e);
      router.replace('/(adopter)/home');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Protocole abandon — Étape {step + 1}/3</Text>
      <Text style={styles.body}>{STEPS[step]}</Text>
      {step < 2 ? (
        <Button label="Je comprends" onPress={() => setStep(step + 1)} />
      ) : (
        <Button label="Commencer la simulation" onPress={finish} loading={loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  body: { lineHeight: 24, marginBottom: 24 },
});
