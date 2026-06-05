import { ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getBreed } from '@sirius/shared';
import { colors } from '../../../lib/theme';

export default function BreedAdviceScreen() {
  const { breedId } = useLocalSearchParams<{ breedId: string }>();
  const breed = getBreed(breedId || 'labrador');

  if (!breed) return <Text>Race introuvable</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Conseils — {breed.name}</Text>
      {breed.behavioralAdvice.map((a) => <Text key={a} style={styles.item}>• {a}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  item: { marginBottom: 8, lineHeight: 22 },
});
