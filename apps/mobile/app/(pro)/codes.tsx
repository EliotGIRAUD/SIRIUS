import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { api } from '../../lib/api';

export default function ProCodesScreen() {
  const [code, setCode] = useState('');

  async function generate() {
    try {
      const data = await api<{ code: string }>('/pro/codes', {
        method: 'POST',
        body: JSON.stringify({ multiUse: true }),
      });
      setCode(data.code);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Génération impossible');
    }
  }

  async function share() {
    if (!code) return;
    await Share.share({ message: `Code SIRIUS pour votre simulation : ${code}` });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code adoptant</Text>
      <Text style={styles.sub}>Générez un code unique à transmettre à un adoptant pour lier son compte à votre refuge.</Text>
      <Pressable style={styles.btn} onPress={generate}>
        <Text style={styles.btnText}>Générer un code</Text>
      </Pressable>
      {code ? (
        <View style={styles.codeBox}>
          <Text style={styles.code}>{code}</Text>
          <Pressable onPress={share}>
            <Text style={styles.link}>Partager</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { color: '#64748b', marginVertical: 12 },
  btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  codeBox: { marginTop: 24, backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 2, color: '#1e293b' },
  link: { color: '#2563eb', marginTop: 12, fontWeight: '600' },
});
