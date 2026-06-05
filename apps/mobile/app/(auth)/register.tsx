import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api, setToken } from '../../lib/api';
import { useAuthStore } from '../../stores/useAppStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { spaCode, setAuth } = useAuthStore();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rgpd, setRgpd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    if (!spaCode) return Alert.alert('Code SPA requis', 'Validez d\'abord votre code refuge');
    if (!rgpd) return Alert.alert('RGPD', 'Vous devez accepter la politique de confidentialité');
    setLoading(true);
    try {
      const data = await api<{ token: string; user: Parameters<typeof setAuth>[1]; devVerifyCode?: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, pseudo, proCode: spaCode, rgpdAccepted: true }),
        },
      );
      await setToken(data.token);
      setAuth(data.token, data.user);
      Alert.alert('Vérification email', `Code dev : ${data.devVerifyCode || '123456'}`);
      router.replace('/(auth)/verify-email');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.sub}>Code SPA : {spaCode || '—'}</Text>
      <Input label="Pseudo" value={pseudo} onChangeText={setPseudo} />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.rgpd} onPress={() => setRgpd(!rgpd)}>
        <Text>{rgpd ? '☑' : '☐'} J'accepte la politique RGPD et le traitement de mes données</Text>
      </Pressable>
      <Button label="Créer mon compte" onPress={onRegister} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { color: colors.muted, marginBottom: 16 },
  rgpd: { marginBottom: 16 },
});
