import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SHOP_CATALOG, SHOP_CATEGORIES } from '@sirius/shared';
import { api } from '../../lib/api';
import { successHaptic } from '../../lib/haptics';
import { useAuthStore, useSimulationStore } from '../../stores/useAppStore';
import { colors } from '../../lib/theme';

const CATEGORY_LABELS: Record<string, string> = {
  essentiels: 'Essentiels',
  croquettes: 'Croquettes',
  care: 'Soins vétérinaires',
  superfluous: 'Jouets',
};

export default function ShopScreen() {
  const budget = useSimulationStore((s) => s.budgetRemaining);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const haptics = useAuthStore((s) => s.user?.settings?.hapticsEnabled ?? true);
  const [category, setCategory] = useState<string>('essentiels');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api<{ simulation: { budgetRemaining: number } }>('/simulation/status')
      .then((d) => setStatus({ budgetRemaining: d.simulation.budgetRemaining }))
      .catch(() => {});
  }, [setStatus]);

  const items = SHOP_CATALOG.filter((i) => i.category === category);

  async function buy(itemId: string) {
    setLoading(itemId);
    try {
      const result = await api<{ simulation: { budgetRemaining: number; gauges: unknown } }>('/simulation/action', {
        method: 'POST',
        body: JSON.stringify({ type: 'shop_purchase', metadata: { itemId } }),
      });
      setStatus({ budgetRemaining: result.simulation.budgetRemaining, gauges: result.simulation.gauges as never });
      await successHaptic(haptics);
      Alert.alert('Achat effectué');
    } catch (err) {
      Alert.alert('Refusé', err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.budget}>Budget : {budget} €</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {SHOP_CATEGORIES.map((c) => (
          <Pressable key={c} style={[styles.tab, category === c && styles.tabActive]} onPress={() => setCategory(c)}>
            <Text style={category === c ? styles.tabTextActive : styles.tabText}>{CATEGORY_LABELS[c] || c}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.label}</Text>
              <Text style={styles.price}>{item.price} €</Text>
            </View>
            <Pressable
              style={[styles.btn, (budget < item.price || loading === item.id) && styles.disabled]}
              onPress={() => buy(item.id)}
              disabled={budget < item.price || loading === item.id}
            >
              <Text style={styles.btnText}>Acheter</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  budget: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  tabs: { marginBottom: 12, maxHeight: 44 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, marginRight: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.text },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  name: { fontWeight: '700' },
  price: { color: colors.muted },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700' },
});
