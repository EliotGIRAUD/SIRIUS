import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useSimulationStore } from '../../../stores/useAppStore';
import { colors } from '../../../lib/theme';

export default function CertificationsScreen() {
  const status = useSimulationStore((s) => s.status);
  const score = useSimulationStore((s) => s.finalScore);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Certifications</Text>
      {status === 'completed' ? (
        <Text>Simulation terminée — Score final {score}/100. Votre refuge peut valider l'attestation sur le portail Pro.</Text>
      ) : (
        <Text>Terminez les 30 jours pour obtenir votre certification.</Text>
      )}
      <Link href="/(adopter)/report" style={styles.link}>Voir le rapport complet</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  link: { marginTop: 16, color: colors.primary, fontWeight: '600' },
});
