import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { GaugeBar } from '../../components/GaugeBar';
import { DogAvatar } from '../../components/DogAvatar';
import { ActionButton } from '../../components/ActionButton';
import { api } from '../../lib/api';
import { successHaptic } from '../../lib/haptics';
import { queueAction } from '../../lib/offline';
import { useAuthStore, useSimulationStore } from '../../stores/useAppStore';
import { colors } from '../../lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const sim = useSimulationStore();
  const setStatus = useSimulationStore((s) => s.setStatus);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const haptics = user?.settings?.hapticsEnabled ?? true;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [initialBudget, setInitialBudget] = useState(450);

  const load = useCallback(async () => {
    try {
      const data = await api<{
        simulation: { currentDay: number; budgetRemaining: number; initialBudget: number; gauges: typeof sim.gauges; status: string; finalScore: number };
        streak?: number;
        healthState?: string;
        dog?: { name: string };
        alerts: Array<{ type: string; message: string }>;
        cooldowns: Record<string, number>;
        hasPdfAccess?: boolean;
      }>('/simulation/status');
      setInitialBudget(data.simulation.initialBudget);
      setStatus({
        currentDay: data.simulation.currentDay,
        budgetRemaining: data.simulation.budgetRemaining,
        gauges: data.simulation.gauges,
        status: data.simulation.status,
        finalScore: data.simulation.finalScore,
        streak: data.streak ?? 0,
        healthState: data.healthState ?? 'happy',
        dogName: data.dog?.name ?? '',
        alerts: data.alerts,
        cooldowns: data.cooldowns,
      });
      if (token && user) {
        setAuth(token, { ...user, hasPdfAccess: data.hasPdfAccess });
      }
    } catch {
      // pas de simulation
    }
  }, [setStatus, token, user, setAuth]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function act(type: string, metadata: Record<string, unknown> = {}) {
    setLoading(type);
    try {
      await api('/simulation/action', { method: 'POST', body: JSON.stringify({ type, metadata }) });
      await successHaptic(haptics);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      if (msg === 'Network request failed' || msg.includes('fetch')) {
        await queueAction('/simulation/action', 'POST', { type, metadata });
        Alert.alert('Hors-ligne', 'Action mise en file — synchronisation au retour réseau.');
      } else {
        Alert.alert('Action refusée', msg);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.day}>J.{sim.currentDay}/30</Text>
        <Pressable onPress={() => router.push('/(adopter)/constellation')}>
          <Text style={styles.streak}>⭐ {sim.streak} étoiles · streak</Text>
        </Pressable>
      </View>
      <Text style={styles.budget}>{sim.budgetRemaining}€ / {initialBudget}€ · Score {sim.finalScore}</Text>

      <DogAvatar state={sim.healthState as 'happy' | 'hungry' | 'tired' | 'sick' | 'sad'} name={sim.dogName || 'Mon chien'} />

      <View style={styles.card}>
        <GaugeBar label="Faim" value={sim.gauges.hunger} color="#f59e0b" />
        <GaugeBar label="Énergie" value={sim.gauges.energy} color="#22c55e" />
        <GaugeBar label="Hygiène" value={sim.gauges.hygiene} color="#06b6d4" />
        <GaugeBar label="Mental" value={sim.gauges.mental} color="#8b5cf6" />
      </View>

      <ActionButton label="Nourrir (gamelle)" onPress={() => router.push('/(adopter)/action/meal')} loading={loading === 'meal'} disabled={Boolean(sim.cooldowns.meal)} cooldownLabel={sim.cooldowns.meal ? `${sim.cooldowns.meal} min` : undefined} />
      <ActionButton label="Abreuver (gamelle)" onPress={() => router.push('/(adopter)/action/water')} loading={loading === 'water'} />
      <ActionButton label="Soigner" onPress={() => act('vet_care', { cost: 55 })} loading={loading === 'vet_care'} />
      <ActionButton label="Affection" onPress={() => act('affection')} loading={loading === 'affection'} />
      <ActionButton label="Brosser" onPress={() => act('brush')} loading={loading === 'brush'} />
      <ActionButton label="Jouer" onPress={() => act('play')} loading={loading === 'play'} />
      <Pressable style={styles.mapBtn} onPress={() => router.push('/(adopter)/map')}>
        <Text style={styles.mapBtnText}>Sortir → Carte GPS</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={async () => { await api('/simulation/advance-day', { method: 'POST' }); await load(); }}>
        <Text style={styles.secondaryText}>Clôturer la journée</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { fontSize: 28, fontWeight: '900', color: colors.text },
  streak: { fontWeight: '700', color: colors.warning },
  budget: { color: colors.muted, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  mapBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  mapBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: colors.border, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  secondaryText: { fontWeight: '600' },
});
