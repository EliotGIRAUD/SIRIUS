import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { colors } from '../../lib/theme';

const SLIDES = [
  { title: 'Le Constat', body: 'Trop de chiens sont abandonnés faute de préparation. SIRIUS simule 30 jours de responsabilité réelle.' },
  { title: 'La Promesse', body: 'Pendant 30 jours, vous apprenez à couvrir tous les besoins vitaux de votre futur compagnon.' },
  { title: 'La Mécanique', body: 'Jauges, budget, règles Labrador : repas, balades GPS, soins et scoring quotidien.' },
  { title: "L'Attestation", body: 'En cas de réussite, votre refuge valide une attestation prouvant votre sérieux.' },
];

export default function OnboardingSlides() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  return (
    <View style={styles.container}>
      <Text style={styles.step}>{idx + 1} / {SLIDES.length}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>
      {idx < SLIDES.length - 1 ? (
        <Button label="Suivant" onPress={() => setIdx(idx + 1)} />
      ) : (
        <Button label="Continuer" onPress={() => router.push('/(onboarding)/permissions')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
  step: { color: colors.muted },
  title: { fontSize: 28, fontWeight: '800', marginVertical: 12 },
  body: { color: colors.text, lineHeight: 24, marginBottom: 24 },
});
