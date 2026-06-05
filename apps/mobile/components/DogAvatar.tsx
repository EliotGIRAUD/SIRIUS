import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';

type HealthState = 'happy' | 'hungry' | 'tired' | 'sick' | 'sad';

const EMOJI: Record<HealthState, string> = {
  happy: '🐕',
  hungry: '🍖',
  tired: '😴',
  sick: '🤒',
  sad: '😢',
};

const LABEL: Record<HealthState, string> = {
  happy: 'En forme',
  hungry: 'A faim',
  tired: 'Fatigué',
  sick: 'Malade',
  sad: 'Besoin d\'affection',
};

interface Props {
  state?: HealthState;
  name?: string;
}

export function DogAvatar({ state = 'happy', name }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, state === 'sick' && styles.sick]}>
        <Text style={styles.emoji}>{EMOJI[state]}</Text>
      </View>
      {name ? <Text style={styles.name}>{name}</Text> : null}
      <Text style={styles.state}>{LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 16 },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  sick: { backgroundColor: '#fee2e2', borderColor: colors.danger },
  emoji: { fontSize: 56 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8 },
  state: { color: colors.muted, marginTop: 4 },
});
