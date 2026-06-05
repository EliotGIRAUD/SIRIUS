import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { B2B_PLANS, B2C_PRODUCTS } from '@sirius/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAppStore';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../lib/theme';

export default function SubscriptionScreen() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);

  async function unlockBreed() {
    setLoading(true);
    try {
      const data = await api<{ ownedBreeds: string[] }>('/simulation/purchase-mock', {
        method: 'POST',
        body: JSON.stringify({ productId: 'breed_unlock', breedId: 'golden' }),
      });
      if (token && user) setAuth(token, { ...user, ownedBreeds: data.ownedBreeds });
      Alert.alert('Achat simulé', `Race débloquée (mock ${B2C_PRODUCTS.breed_unlock.priceEur} €)`);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    } finally {
      setLoading(false);
    }
  }

  async function goPremium() {
    setLoading(true);
    try {
      const data = await api<{ user: { plan: string } }>('/billing/plan', {
        method: 'PATCH',
        body: JSON.stringify({ plan: 'premium' }),
      });
      if (token && user) setAuth(token, { ...user, plan: data.user.plan as 'premium' });
      Alert.alert('Premium', 'Plan premium activé (démo)');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon abonnement</Text>
      <Text style={styles.plan}>Plan actuel : {user?.plan || 'free'}</Text>
      <Text style={styles.sub}>Races possédées : {(user?.ownedBreeds || ['labrador']).join(', ')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Freemium</Text>
        <Text>Labrador gratuit · Simulation 30j · Constellation</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Débloquer une race — {B2C_PRODUCTS.breed_unlock.priceEur} €</Text>
        <Button label="Acheter Golden (mock)" onPress={unlockBreed} loading={loading} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Premium — catalogue complet</Text>
        <Text>Journal, badges, attestations incluses</Text>
        <Button label="Activer Premium (démo)" onPress={goPremium} variant="secondary" loading={loading} />
      </View>

      <Text style={styles.hint}>Refuge SPA : {B2B_PLANS.spa_launch.priceEur} €/mois (web-pro)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  plan: { fontWeight: '600', marginTop: 8 },
  sub: { color: colors.muted, marginBottom: 16 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  hint: { color: colors.muted, marginTop: 16, fontSize: 12 },
});
