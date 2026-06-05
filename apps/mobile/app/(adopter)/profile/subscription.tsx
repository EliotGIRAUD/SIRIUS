import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/theme';

export default function SubscriptionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon abonnement</Text>
      <Text style={styles.sub}>Fonctionnalité à venir — accès premium refuge et races supplémentaires.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 8 },
});
