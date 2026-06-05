import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BREEDS } from '@sirius/shared';
import { colors } from '../../../lib/theme';

export default function CompareBreedsScreen() {
  const [selected, setSelected] = useState<string[]>(['labrador']);

  function toggle(id: string) {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 3) return s;
      return [...s, id];
    });
  }

  const breeds = BREEDS.filter((b) => selected.includes(b.id));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Comparateur (max 3)</Text>
      <View style={styles.chips}>
        {BREEDS.map((b) => (
          <Pressable key={b.id} style={[styles.chip, selected.includes(b.id) && styles.chipOn]} onPress={() => toggle(b.id)}>
            <Text>{b.name}</Text>
          </Pressable>
        ))}
      </View>
      {breeds.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.name}>{b.name}</Text>
          <Text>Budget : {b.baseBudget}€ (±{b.variancePercent}%)</Text>
          <Text>Santé : {b.healthIssues.join(', ')}</Text>
          <Text>Soins : {b.careRequirements.join(', ')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { padding: 8, backgroundColor: colors.card, borderRadius: 8 },
  chipOn: { backgroundColor: colors.primary },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  name: { fontWeight: '800', marginBottom: 6 },
});
