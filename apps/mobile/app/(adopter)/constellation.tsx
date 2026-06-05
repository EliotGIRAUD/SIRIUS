import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';

interface Star { id: string; day: number; type: string; title: string; description: string; status: string }

export default function ConstellationScreen() {
  const [stars, setStars] = useState<Star[]>([]);
  const [obtained, setObtained] = useState(0);
  const [trophy, setTrophy] = useState(false);
  const [selected, setSelected] = useState<Star | null>(null);

  useEffect(() => {
    api<{ constellation: { stars: Star[]; obtained: number; trophyUnlocked: boolean } }>('/simulation/constellation')
      .then((d) => {
        setStars(d.constellation.stars);
        setObtained(d.constellation.obtained);
        setTrophy(d.constellation.trophyUnlocked);
      })
      .catch(() => {});
  }, []);

  const color = (s: string) => {
    if (s === 'obtained') return colors.success;
    if (s === 'failed') return colors.danger;
    if (s === 'available') return colors.star;
    return colors.border;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Constellation</Text>
      <Text style={styles.sub}>{obtained}/{stars.length} étoiles · {trophy ? '🏆 Trophée J+30' : 'Trophée en cours'}</Text>

      <View style={styles.grid}>
        {stars.map((star) => (
          <Pressable key={star.id} style={[styles.star, { backgroundColor: color(star.status) }]} onPress={() => setSelected(star)}>
            <Text style={styles.starDay}>{star.day}</Text>
          </Pressable>
        ))}
      </View>

      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text>{selected.description}</Text>
          <Text style={styles.status}>Statut : {selected.status}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  star: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  starDay: { color: '#fff', fontWeight: '800', fontSize: 12 },
  detail: { marginTop: 16, padding: 16, backgroundColor: colors.card, borderRadius: 12 },
  detailTitle: { fontWeight: '800', fontSize: 16 },
  status: { color: colors.muted, marginTop: 8 },
});
