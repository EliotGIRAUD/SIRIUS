import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/theme';

export default function DogsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes chiens</Text>
      <Text style={styles.sub}>Ajouter ou changer de chien — disponible en V2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 8 },
});
