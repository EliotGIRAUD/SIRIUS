import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { BREEDS } from '@sirius/shared';
import { useAuthStore } from '../../../stores/useAppStore';
import { colors } from '../../../lib/theme';

const DEFAULT_OWNED = ['labrador'] as const;

export default function BreedCatalogScreen() {
  const router = useRouter();
  const owned = useAuthStore((s) => s.user?.ownedBreeds ?? DEFAULT_OWNED);
  const plan = useAuthStore((s) => s.user?.plan || 'free');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Catalogue des races</Text>
      <Link href="/(adopter)/breeds/compare" style={styles.link}>Comparer les races</Link>
      {BREEDS.map((b) => {
        const unlocked = !b.locked || owned.includes(b.id) || plan === 'premium';
        return (
          <Pressable
            key={b.id}
            style={[styles.card, !unlocked && styles.locked]}
            onPress={() => unlocked && router.push(`/(adopter)/breeds/${b.id}`)}
          >
            <Text style={styles.name}>{b.name}{unlocked ? '' : ' 🔒 2,99€'}</Text>
            <Text style={styles.sub}>Budget base : {b.baseBudget}€ · Coût mensuel ~{b.monthlyCostEur}€</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  link: { color: colors.primary, fontWeight: '600', marginBottom: 16 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  locked: { opacity: 0.6 },
  name: { fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 4 },
});
