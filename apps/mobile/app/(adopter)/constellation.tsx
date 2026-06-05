import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';

interface Star { id: string; day: number; type: string; title: string; description: string; status: string }

export default function ConstellationScreen() {
  const router = useRouter();
  const [stars, setStars] = useState<Star[]>([]);
  const [obtained, setObtained] = useState(0);
  const [streak, setStreak] = useState(0);
  const [trophy, setTrophy] = useState(false);
  const [selected, setSelected] = useState<Star | null>(null);

  useEffect(() => {
    api<{ constellation: { stars: Star[]; obtained: number; trophyUnlocked: boolean }; streak: number }>('/simulation/constellation')
      .then((d) => {
        setStars(d.constellation.stars);
        setObtained(d.constellation.obtained);
        setTrophy(d.constellation.trophyUnlocked);
        setStreak(d.streak);
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
      <Text style={styles.title}>Constellation & Streaks</Text>
      <Text style={styles.sub}>🔥 Streak {streak} · {obtained}/{stars.length} étoiles</Text>
      {trophy ? (
        <Pressable style={styles.trophy} onPress={() => router.push('/(adopter)/report')}>
          <Text style={styles.trophyText}>🏆 Trophée J+30 — Voir le rapport</Text>
        </Pressable>
      ) : null}

      <Text style={styles.legend}>Discipline (haut) · Événements (bas)</Text>
      <View style={styles.grid}>
        {stars.filter((s) => s.type === 'discipline').map((star) => (
          <Pressable key={star.id} style={[styles.star, { backgroundColor: color(star.status) }]} onPress={() => setSelected(star)}>
            <Text style={styles.starDay}>{star.day}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {stars.filter((s) => s.type === 'event').map((star) => (
          <Pressable key={star.id} style={[styles.star, styles.starEvent, { backgroundColor: color(star.status) }]} onPress={() => setSelected(star)}>
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
  sub: { color: colors.muted, marginBottom: 12 },
  trophy: { backgroundColor: '#fef3c7', padding: 14, borderRadius: 12, marginBottom: 12 },
  trophyText: { fontWeight: '700', textAlign: 'center' },
  legend: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  star: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starEvent: { borderWidth: 2, borderColor: '#fff' },
  starDay: { color: '#fff', fontWeight: '800', fontSize: 11 },
  detail: { marginTop: 8, padding: 16, backgroundColor: colors.card, borderRadius: 12 },
  detailTitle: { fontWeight: '800', fontSize: 16 },
  status: { color: colors.muted, marginTop: 8 },
});
