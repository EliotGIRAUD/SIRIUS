import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../lib/theme';

interface Poi { name: string; lat: number; lng: number }
interface WalkSession { _id: string; startedAt: string; durationMinutes?: number; distanceMeters?: number; validated?: boolean }

export default function MapScreen() {
  const [pois, setPois] = useState<{ shelter: Poi | null; breeders: Poi[]; vets: Poi[] } | null>(null);
  const [session, setSession] = useState<WalkSession | null>(null);
  const [recent, setRecent] = useState<WalkSession[]>([]);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api<{ shelter: Poi | null; breeders: Poi[]; vets: Poi[] }>('/simulation/map/pois').then(setPois).catch(() => {});
    api<{ recentWalks?: WalkSession[] }>('/simulation/status')
      .then((d) => setRecent(d.recentWalks || []))
      .catch(() => {});
  }, []);

  async function startWalk() {
    try {
      const data = await api<{ session: WalkSession }>('/simulation/walk/start', { method: 'POST' });
      setSession(data.session);
      setActive(true);
      setElapsed(0);
      intervalRef.current = setInterval(async () => {
        setElapsed((e) => e + 1);
        try {
          const Loc = await import('expo-location');
          const pos = await Loc.getCurrentPositionAsync({});
          await api(`/simulation/walk/${data.session._id}/points`, {
            method: 'POST',
            body: JSON.stringify({ points: [{ lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() }] }),
          });
        } catch {
          // GPS unavailable
        }
      }, 15000);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de démarrer');
    }
  }

  async function endWalk() {
    if (!session) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      const result = await api<{ session: WalkSession; validation: { validated: boolean; cheatFlags: string[] } }>(
        `/simulation/walk/${session._id}/end`,
        { method: 'POST' },
      );
      setActive(false);
      Alert.alert(
        result.validation.validated ? 'Balade validée' : 'Balade rejetée',
        result.validation.cheatFlags.join(', ') || 'OK',
      );
      setRecent((r) => [result.session, ...r]);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Fin de balade impossible');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Carte & balades</Text>
      <Card>
        <Text style={styles.mapPlaceholder}>🗺️ Carte GPS</Text>
        <Text style={styles.hint}>Marqueurs SPA, éleveurs et vétérinaires</Text>
        {pois?.shelter ? <Text>🏠 {pois.shelter.name}</Text> : null}
        {pois?.breeders.map((p) => <Text key={p.name}>🐕 {p.name}</Text>)}
        {pois?.vets.map((p) => <Text key={p.name}>🏥 {p.name}</Text>)}
      </Card>

      {active ? (
        <Card>
          <Text style={styles.active}>Balade active — {Math.floor(elapsed / 60)} min</Text>
          <Button label="Terminer la balade" onPress={endWalk} />
        </Card>
      ) : (
        <Button label="Démarrer une balade" onPress={startWalk} />
      )}

      <Text style={styles.section}>Balades récentes</Text>
      {recent.length === 0 ? <Text style={styles.muted}>Aucune balade</Text> : null}
      {recent.map((w) => (
        <Pressable key={w._id} style={styles.walkRow}>
          <Text>{w.validated ? '✓' : '✗'} {w.durationMinutes ?? 0} min — {w.distanceMeters ?? 0} m</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  mapPlaceholder: { fontSize: 32, textAlign: 'center' },
  hint: { color: colors.muted, textAlign: 'center', marginBottom: 8 },
  active: { fontWeight: '700', marginBottom: 8 },
  section: { fontWeight: '700', marginTop: 16, marginBottom: 8 },
  muted: { color: colors.muted },
  walkRow: { padding: 10, backgroundColor: colors.card, borderRadius: 8, marginBottom: 6 },
});
