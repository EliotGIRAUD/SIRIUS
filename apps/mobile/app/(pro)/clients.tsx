import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { WEB_PRO_URL } from '../../lib/config';

interface Client {
  id: string;
  displayName: string;
  email: string;
  simulation: {
    currentDay: number;
    finalScore: number;
    status: string;
  } | null;
}

export default function ProClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ clients: Client[] }>('/pro/clients');
    setClients(data.clients);
  }, []);

  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  return (
    <View style={styles.container}>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.meta}>{item.email}</Text>
            <Text style={styles.meta}>
              {item.simulation ? `J${item.simulation.currentDay}/30 — Score ${item.simulation.finalScore}` : 'Simulation non démarrée'}
            </Text>
            <Pressable onPress={() => Linking.openURL(`${WEB_PRO_URL}/client/${item.id}`)}>
              <Text style={styles.link}>Voir le détail sur le portail web →</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun client rattaché</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: '#64748b', marginTop: 4 },
  link: { color: '#2563eb', marginTop: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
