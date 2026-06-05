import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBreed } from '@sirius/shared';
import { colors } from '../../../lib/theme';

export default function BreedDetailScreen() {
  const router = useRouter();
  const { breedId } = useLocalSearchParams<{ breedId: string }>();
  const breed = getBreed(breedId || '');

  if (!breed) return <Text>Race introuvable</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{breed.name}</Text>
      <Text>{breed.description}</Text>
      <Text style={styles.section}>Coûts</Text>
      <Text>Budget simulation : {breed.baseBudget}€ (±{breed.variancePercent}%)</Text>
      <Text>Coût mensuel estimé : {breed.monthlyCostEur}€</Text>
      <Text style={styles.section}>Problèmes de santé</Text>
      {breed.healthIssues.map((h) => <Text key={h}>• {h}</Text>)}
      <Text style={styles.section}>Soins nécessaires</Text>
      {breed.careRequirements.map((c) => <Text key={c}>• {c}</Text>)}
      <Text style={styles.section}>Besoins</Text>
      {breed.needs.map((n) => <Text key={n}>• {n}</Text>)}
      <Pressable onPress={() => router.push({ pathname: '/(adopter)/breeds/advice', params: { breedId: breed.id } })}>
        <Text style={styles.link}>Conseils comportementaux</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  section: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
  link: { color: colors.primary, marginTop: 20, fontWeight: '600' },
});
