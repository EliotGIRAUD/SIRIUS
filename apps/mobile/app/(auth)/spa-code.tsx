import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/useAppStore';
import { CodeInput } from '../../components/ui/CodeInput';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function SpaCodeScreen() {
  const router = useRouter();
  const setSpaCode = useAuthStore((s) => s.setSpaCode);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [shelterName, setShelterName] = useState('');

  async function validate() {
    if (code.length !== 6) return Alert.alert('Code SPA', 'Entrez 6 caractères');
    setLoading(true);
    try {
      const data = await api<{ valid: boolean; shelter?: { name: string } }>('/auth/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setSpaCode(code);
      setShelterName(data.shelter?.name || '');
      router.push('/(auth)/register');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code SPA</Text>
      <Text style={styles.sub}>Entrez le code à 6 caractères fourni par votre refuge</Text>
      <CodeInput value={code} onChange={setCode} />
      {shelterName ? <Text style={styles.ok}>Refuge : {shelterName}</Text> : null}
      <Button label="Valider le code" onPress={validate} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, marginBottom: 8 },
  ok: { color: colors.success, textAlign: 'center', marginBottom: 12 },
});
