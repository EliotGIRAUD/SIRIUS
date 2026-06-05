import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BREEDS } from '@sirius/shared';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function BreedsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('labrador');
  const breed = BREEDS.find((b) => b.id === selected);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choix du chien</Text>
      <View style={styles.grid}>
        {BREEDS.map((b) => (
          <Pressable
            key={b.id}
            style={[styles.item, selected === b.id && styles.selected, b.locked && styles.locked]}
            onPress={() => !b.locked && setSelected(b.id)}
            disabled={b.locked}
          >
            <Text style={styles.itemText}>{b.name}{b.locked ? ' 🔒' : ''}</Text>
          </Pressable>
        ))}
      </View>
      {breed ? (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{breed.name}</Text>
          <Text>{breed.description}</Text>
          {breed.needs.map((n) => <Text key={n}>• {n}</Text>)}
        </View>
      ) : null}
      <Button label="Nommer mon chien" onPress={() => router.push({ pathname: '/(onboarding)/name-dog', params: { breedId: selected } })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  grid: { gap: 8, marginBottom: 16 },
  item: { padding: 14, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  locked: { opacity: 0.5 },
  itemText: { fontWeight: '600' },
  detail: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 16 },
  detailTitle: { fontWeight: '800', fontSize: 18, marginBottom: 8 },
});
