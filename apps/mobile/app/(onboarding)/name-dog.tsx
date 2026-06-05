import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function NameDogScreen() {
  const router = useRouter();
  const { breedId } = useLocalSearchParams<{ breedId: string }>();
  const [name, setName] = useState('');
  const [sccLetter, setSccLetter] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nommage</Text>
      <Text style={styles.sub}>Lettre SCC recommandée pour le registre</Text>
      <Input label="Nom du chien" value={name} onChangeText={setName} />
      <Input label="Lettre SCC" value={sccLetter} onChangeText={setSccLetter} maxLength={1} autoCapitalize="characters" />
      <Button
        label="Contrat moral"
        onPress={() => {
          if (!name.trim()) return Alert.alert('Nom requis');
          router.push({ pathname: '/(onboarding)/contract', params: { breedId, name, sccLetter } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, marginBottom: 16 },
});
