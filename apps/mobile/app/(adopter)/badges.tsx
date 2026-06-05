import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';

interface Badge { id: string; title: string; description: string; unlocked: boolean }

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    api<{ badges: Badge[] }>('/simulation/badges').then((d) => setBadges(d.badges)).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Badges</Text>
      {badges.map((b) => (
        <View key={b.id} style={[styles.card, !b.unlocked && styles.locked]}>
          <Text style={styles.name}>{b.unlocked ? '🏅' : '🔒'} {b.title}</Text>
          <Text style={styles.desc}>{b.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  locked: { opacity: 0.5 },
  name: { fontWeight: '700' },
  desc: { color: colors.muted, marginTop: 4 },
});
