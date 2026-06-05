import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { B2C_PRODUCTS } from '@sirius/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAppStore';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../lib/theme';

const STEPS = [
  'Abandonner un chien en simulation a des conséquences sur votre score et votre constellation.',
  'Vous perdrez votre progression actuelle et devrez recommencer une simulation.',
  'Pour adopter une nouvelle race, un paiement de 2,99 € (simulé) est requis après abandon.',
];

export default function DogsScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    try {
      await api('/simulation/abandon', { method: 'POST' });
      const purchase = await api<{ ownedBreeds: string[] }>('/simulation/purchase-mock', {
        method: 'POST',
        body: JSON.stringify({ productId: 'breed_unlock', breedId: 'golden' }),
      });
      if (token && user) setAuth(token, { ...user, ownedBreeds: purchase.ownedBreeds });
      Alert.alert('Abandon enregistré', `Payez ${B2C_PRODUCTS.breed_unlock.priceEur}€ (mock) — choisissez une nouvelle race`);
      router.push('/(adopter)/breeds/catalog');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Changer de chien</Text>
      <Text style={styles.sub}>Un seul chien actif à la fois</Text>
      {step < 3 ? (
        <>
          <Text style={styles.step}>Étape {step + 1}/3</Text>
          <Text style={styles.body}>{STEPS[step]}</Text>
          <Button label="Je comprends" onPress={() => setStep(step + 1)} />
        </>
      ) : (
        <Button label="Abandonner et débloquer une race (mock)" onPress={finish} loading={loading} />
      )}
      <Button label="Voir le catalogue" onPress={() => router.push('/(adopter)/breeds/catalog')} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, marginBottom: 16 },
  step: { fontWeight: '700', marginBottom: 8 },
  body: { lineHeight: 22, marginBottom: 16 },
});
