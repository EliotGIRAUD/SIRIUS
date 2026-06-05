import { Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore, useSimulationStore } from '../../../stores/useAppStore';
import { logout } from '../../../lib/session';
import { colors } from '../../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const score = useSimulationStore((s) => s.finalScore);
  const day = useSimulationStore((s) => s.currentDay);

  async function onLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.container} accessibilityLabel="Écran profil">
      <Text style={styles.title} accessibilityRole="header">{user?.pseudo || user?.displayName}</Text>
      <Text style={styles.sub}>{user?.email}</Text>
      <Text style={styles.stat}>Jour {day}/30 · Score {score}</Text>

      <Link href="/(adopter)/profile/certifications" style={styles.link} accessibilityLabel="Mes certifications">Mes Certifications</Link>
      <Link href="/(adopter)/constellation" style={styles.link} accessibilityLabel="Mes constellations">Mes Constellations</Link>
      <Link href="/(adopter)/profile/settings" style={styles.link} accessibilityLabel="Paramètres">Paramètres</Link>
      <Link href="/(adopter)/profile/subscription" style={styles.link} accessibilityLabel="Mon abonnement">Mon abonnement</Link>
      <Link href="/(adopter)/profile/dogs" style={styles.link} accessibilityLabel="Changer de chien">Changer de chien</Link>

      <Pressable style={styles.logout} onPress={onLogout} accessibilityLabel="Déconnexion" accessibilityRole="button">
        <Text style={styles.logoutText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted },
  stat: { marginVertical: 16, fontWeight: '600' },
  link: { paddingVertical: 14, color: colors.primary, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: colors.border },
  logout: { marginTop: 24, padding: 14, backgroundColor: '#fee2e2', borderRadius: 12, alignItems: 'center' },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
