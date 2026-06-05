import { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { api } from '../../../lib/api';
import { scheduleDailyReminders } from '../../../lib/notifications';
import { useAuthStore } from '../../../stores/useAppStore';
import { colors } from '../../../lib/theme';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [sounds, setSounds] = useState(user?.settings?.soundsEnabled ?? true);
  const [haptics, setHaptics] = useState(user?.settings?.hapticsEnabled ?? true);
  const [notif, setNotif] = useState(user?.settings?.notificationsEnabled ?? false);

  async function save(patch: Record<string, boolean>) {
    await api('/auth/settings', { method: 'PATCH', body: JSON.stringify(patch) });
    if (token && user) setAuth(token, { ...user, settings: { ...user.settings, ...patch } });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      <View style={styles.row}><Text>Sons</Text><Switch value={sounds} onValueChange={(v) => { setSounds(v); save({ soundsEnabled: v }); }} /></View>
      <View style={styles.row}><Text>Haptiques</Text><Switch value={haptics} onValueChange={(v) => { setHaptics(v); save({ hapticsEnabled: v }); }} /></View>
      <View style={styles.row}><Text>Notifications</Text><Switch value={notif} onValueChange={(v) => { setNotif(v); save({ notificationsEnabled: v }); scheduleDailyReminders(v); }} /></View>
      <Text style={styles.rgpd}>RGPD : vos données sont utilisées pour la simulation et le suivi refuge.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rgpd: { marginTop: 24, color: colors.muted, lineHeight: 20 },
});
