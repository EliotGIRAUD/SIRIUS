import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { isExpoGo, requestNotificationPermission } from '../../lib/notifications';
import { colors } from '../../lib/theme';

export default function PermissionsScreen() {
  const router = useRouter();
  const [gpsLocked, setGpsLocked] = useState(true);
  const [notifOk, setNotifOk] = useState(false);

  async function requestGps() {
    try {
      const Loc = await import('expo-location');
      const { status } = await Loc.requestForegroundPermissionsAsync();
      setGpsLocked(status !== 'granted');
      if (status !== 'granted') Alert.alert('GPS', 'La balade nécessite la localisation');
    } catch {
      Alert.alert('GPS', 'Module localisation indisponible — activez-le plus tard');
      setGpsLocked(false);
    }
  }

  async function requestNotif() {
    if (isExpoGo()) {
      Alert.alert('Expo Go', 'Les notifications push seront disponibles dans un build de développement. Mode simulé pour la démo.');
      setNotifOk(true);
      return;
    }
    const ok = await requestNotificationPermission();
    setNotifOk(ok);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permissions</Text>
      <Card style={gpsLocked ? styles.locked : undefined}>
        <Text style={styles.cardTitle}>GPS {gpsLocked ? '🔒' : '✓'}</Text>
        <Text style={styles.cardBody}>Nécessaire pour valider vos balades et l'anti-triche.</Text>
        {gpsLocked ? <Button label="Autoriser GPS" onPress={requestGps} /> : null}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Notifications {notifOk ? '✓' : ''}</Text>
        <Text style={styles.cardBody}>
          Rappels repas, balades et streak.{isExpoGo() ? ' (simulé en Expo Go)' : ''}
        </Text>
        <Button label="Autoriser notifications" onPress={requestNotif} variant="secondary" />
      </Card>
      <Button label="Continuer" onPress={() => router.push('/(onboarding)/breeds')} disabled={gpsLocked} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardBody: { color: colors.muted, marginVertical: 8 },
  locked: { opacity: 0.85, borderWidth: 1, borderColor: colors.warning },
});
