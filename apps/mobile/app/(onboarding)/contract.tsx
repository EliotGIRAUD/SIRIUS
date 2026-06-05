import { useState } from 'react';
import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

export default function ContractScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ breedId: string; name: string; sccLetter: string }>();
  const [accepted, setAccepted] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contrat moral</Text>
      <Text style={styles.body}>
        Je m'engage à assurer le bien-être de mon chien pendant 30 jours : alimentation, soins, activité et respect du budget.
        J'accepte que mon score et mon attestation reflètent la qualité de mes choix.
      </Text>
      <Pressable onPress={() => setAccepted(!accepted)}>
        <Text>{accepted ? '☑' : '☐'} J'accepte le contrat moral</Text>
      </Pressable>
      <Button
        label="Protocole d'abandon"
        onPress={() => router.push({ pathname: '/(onboarding)/abandon', params })}
        disabled={!accepted}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  body: { lineHeight: 22, marginBottom: 16, color: colors.text },
});
