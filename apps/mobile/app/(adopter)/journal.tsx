import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';

interface Entry {
  day: number;
  score: number | null;
  penalties: Array<{ message: string }>;
  budgetEvents?: Array<{ label: string; amount: number }>;
  weeklyChallenge?: { title: string; completed: boolean };
  closed: boolean;
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api<{ entries: Entry[] }>('/simulation/journal').then((d) => setEntries(d.entries)).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Journal de bord</Text>
      {entries.map((e) => (
        <View key={e.day} style={styles.card}>
          <Text style={styles.day}>Jour {e.day} {e.closed ? '✓' : '…'}</Text>
          {e.score != null ? <Text>Score : {e.score}</Text> : null}
          {e.weeklyChallenge ? <Text style={styles.challenge}>Défi : {e.weeklyChallenge.title} {e.weeklyChallenge.completed ? '✓' : ''}</Text> : null}
          {e.budgetEvents?.map((b, i) => <Text key={i} style={styles.budget}>{b.label} : {b.amount}€</Text>)}
          {e.penalties?.map((p, i) => <Text key={i} style={styles.penalty}>⚠ {p.message}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  day: { fontWeight: '700', marginBottom: 4 },
  challenge: { color: colors.primary, marginTop: 4 },
  budget: { color: colors.muted, marginTop: 2 },
  penalty: { color: colors.danger, fontSize: 12, marginTop: 2 },
});
