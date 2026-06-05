import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../lib/api';
import { useSimulationStore } from '../../stores/useAppStore';
import { colors } from '../../lib/theme';

export default function ReportScreen() {
  const sim = useSimulationStore();
  const [trophy, setTrophy] = useState(false);
  const [obtained, setObtained] = useState(0);

  useEffect(() => {
    api<{
      simulation: { status: string; finalScore: number; currentDay: number };
      constellation?: { obtained: number; trophyUnlocked: boolean };
    }>('/simulation/status')
      .then((data) => {
        useSimulationStore.getState().setStatus({
          status: data.simulation.status,
          finalScore: data.simulation.finalScore,
          currentDay: data.simulation.currentDay,
        });
        if (data.constellation) {
          setObtained(data.constellation.obtained);
          setTrophy(data.constellation.trophyUnlocked);
        }
      })
      .catch(() => {});

    api<{ constellation: { obtained: number; trophyUnlocked: boolean } }>('/simulation/constellation')
      .then((d) => {
        setObtained(d.constellation.obtained);
        setTrophy(d.constellation.trophyUnlocked);
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rapport de simulation</Text>
      <Text style={styles.score}>Score actuel : {sim.finalScore}/100</Text>
      <Text style={styles.status}>Statut : {sim.status === 'completed' ? 'Terminée' : 'En cours'}</Text>
      <Text style={styles.stars}>Constellation : {obtained}/30 étoiles</Text>

      {trophy || sim.status === 'completed' ? (
        <View style={styles.trophy}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.trophyTitle}>Trophée J+30</Text>
          <Text>Félicitations ! Vous avez terminé les 30 jours de simulation.</Text>
        </View>
      ) : null}

      {sim.status === 'completed' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attestation</Text>
          <Text>Votre refuge peut valider votre attestation depuis le portail Pro.</Text>
          <Text style={styles.hint}>Score final : {sim.finalScore}/100</Text>
        </View>
      ) : (
        <Text style={styles.hint}>Terminez les 30 jours pour obtenir votre certification et le trophée.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  score: { fontSize: 20, marginTop: 8, color: colors.primary },
  status: { color: colors.muted, marginBottom: 4 },
  stars: { color: colors.muted, marginBottom: 16 },
  trophy: { backgroundColor: '#fef3c7', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  trophyEmoji: { fontSize: 48 },
  trophyTitle: { fontSize: 20, fontWeight: '800', marginVertical: 8 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  hint: { color: colors.muted, marginTop: 8 },
});
