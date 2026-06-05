import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Button } from './ui/Button';
import { colors } from '../lib/theme';

type PourQuality = 'low' | 'ok' | 'high';

interface Props {
  mode: 'meal' | 'water';
  onComplete: (result: { fillPercent: number; grams?: number; pourQuality: PourQuality }) => void;
}

export function BowlFillGame({ mode, onComplete }: Props) {
  const [fill, setFill] = useState(0);
  const [tilt, setTilt] = useState(0);
  const anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    (async () => {
      try {
        const Sensors = await import('expo-sensors');
        const { status } = await Sensors.Accelerometer.requestPermissionsAsync();
        if (status !== 'granted') return;
        Sensors.Accelerometer.setUpdateInterval(200);
        sub = Sensors.Accelerometer.addListener(({ x }: { x: number }) => {
          const t = Math.max(-1, Math.min(1, x));
          setTilt(t);
          setFill((f) => Math.min(100, Math.max(0, f + (t > 0.15 ? 2 : t < -0.05 ? -0.5 : 0))));
        });
      } catch {
        // fallback boutons
      }
    })();
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    Animated.timing(anim, { toValue: fill, duration: 150, useNativeDriver: false }).start();
  }, [fill, anim]);

  function finish() {
    let pourQuality: PourQuality = 'ok';
    if (mode === 'meal') {
      const grams = Math.round(250 + fill * 2);
      if (grams < 300) pourQuality = 'low';
      else if (grams > 400) pourQuality = 'high';
      onComplete({ fillPercent: fill, grams, pourQuality });
    } else {
      if (fill < 40) pourQuality = 'low';
      else if (fill > 90) pourQuality = 'high';
      onComplete({ fillPercent: fill, pourQuality });
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{mode === 'meal' ? 'Remplir la gamelle' : 'Abreuver'}</Text>
      <Text style={styles.hint}>Inclinez le téléphone pour verser (ou utilisez les boutons)</Text>
      <View style={styles.bowl}>
        <Animated.View style={[styles.fill, { height: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
        <Text style={styles.pct}>{Math.round(fill)}%</Text>
      </View>
      <Text style={styles.tilt}>Inclinaison : {tilt.toFixed(2)}</Text>
      <View style={styles.row}>
        <Button label="-" onPress={() => setFill((f) => Math.max(0, f - 5))} variant="secondary" />
        <Button label="+" onPress={() => setFill((f) => Math.min(100, f + 5))} variant="secondary" />
      </View>
      <Button label="Valider" onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  hint: { color: colors.muted, marginBottom: 16 },
  bowl: { height: 160, borderWidth: 3, borderColor: colors.primary, borderRadius: 80, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 12 },
  fill: { backgroundColor: '#f59e0b', width: '100%' },
  pct: { position: 'absolute', alignSelf: 'center', top: '40%', fontWeight: '800', fontSize: 24 },
  tilt: { textAlign: 'center', color: colors.muted, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12, justifyContent: 'center' },
});
