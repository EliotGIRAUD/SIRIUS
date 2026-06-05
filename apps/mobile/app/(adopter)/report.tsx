import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { B2C_PRODUCTS } from '@sirius/shared';
import { api, getToken } from '../../lib/api';
import { getApiUrl } from '../../lib/config';
import { Button } from '../../components/ui/Button';
import { useAuthStore, useSimulationStore } from '../../stores/useAppStore';
import { colors } from '../../lib/theme';

export default function ReportScreen() {
  const sim = useSimulationStore();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [trophy, setTrophy] = useState(false);
  const [obtained, setObtained] = useState(0);
  const hasPdf = user?.hasPdfAccess || user?.plan === 'premium';

  useEffect(() => {
    api<{ constellation: { obtained: number; trophyUnlocked: boolean } }>('/simulation/constellation')
      .then((d) => {
        setObtained(d.constellation.obtained);
        setTrophy(d.constellation.trophyUnlocked);
      })
      .catch(() => {});
  }, []);

  async function buyPdf() {
    try {
      const data = await api<{ hasPdfAccess: boolean }>('/simulation/purchase-mock', {
        method: 'POST',
        body: JSON.stringify({ productId: 'pdf_report' }),
      });
      if (token && user) setAuth(token, { ...user, hasPdfAccess: data.hasPdfAccess });
      Alert.alert('Achat simulé', 'Rapport PDF débloqué (mock 4,99 €)');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    }
  }

  async function openPdf() {
    const t = await getToken();
    Linking.openURL(`${getApiUrl()}/simulation/attestation.pdf`).catch(() => {
      Alert.alert('PDF', 'Ouvrez depuis l\'app une fois la simulation terminée et validée par le refuge.');
    });
    void t;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rapport de simulation</Text>
      <Text style={styles.score}>Score : {sim.finalScore}/100</Text>
      <Text style={styles.stars}>Constellation : {obtained}/30</Text>

      {trophy || sim.status === 'completed' ? (
        <View style={styles.trophy}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.trophyTitle}>Trophée J+30</Text>
        </View>
      ) : null}

      {!hasPdf ? (
        <View style={styles.paywall}>
          <Text style={styles.payTitle}>Rapport PDF + Attestation</Text>
          <Text>{B2C_PRODUCTS.pdf_report.label} — {B2C_PRODUCTS.pdf_report.priceEur} €</Text>
          <Button label="Acheter (démo)" onPress={buyPdf} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PDF débloqué</Text>
          <Button label="Télécharger le rapport" onPress={openPdf} variant="secondary" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  score: { fontSize: 20, marginTop: 8, color: colors.primary },
  stars: { color: colors.muted, marginBottom: 16 },
  trophy: { backgroundColor: '#fef3c7', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  trophyEmoji: { fontSize: 48 },
  trophyTitle: { fontSize: 20, fontWeight: '800', marginVertical: 8 },
  paywall: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12 },
  payTitle: { fontWeight: '700', marginBottom: 8 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
});
