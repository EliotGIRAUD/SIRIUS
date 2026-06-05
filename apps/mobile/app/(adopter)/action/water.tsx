import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BowlFillGame } from '../../../components/BowlFillGame';
import { api } from '../../../lib/api';
import { successHaptic } from '../../../lib/haptics';
import { useAuthStore } from '../../../stores/useAppStore';
import { colors } from '../../../lib/theme';

export default function WaterActionScreen() {
  const router = useRouter();
  const haptics = useAuthStore((s) => s.user?.settings?.hapticsEnabled ?? true);
  const [loading, setLoading] = useState(false);

  async function onComplete(result: { pourQuality: string; fillPercent: number }) {
    setLoading(true);
    try {
      await api('/simulation/action', {
        method: 'POST',
        body: JSON.stringify({ type: 'water', metadata: { pourQuality: result.pourQuality, fillPercent: result.fillPercent } }),
      });
      await successHaptic(haptics);
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Action refusée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <BowlFillGame mode="water" onComplete={onComplete} />
      {loading ? null : null}
    </ScrollView>
  );
}
