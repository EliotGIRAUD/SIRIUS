import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  cooldownLabel?: string;
  loading?: boolean;
}

export function ActionButton({ label, onPress, disabled, cooldownLabel, loading }: Props) {
  return (
    <Pressable
      style={[styles.btn, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.text}>{label}</Text>
          {cooldownLabel ? <Text style={styles.sub}>{cooldownLabel}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sub: { color: '#dbeafe', fontSize: 12, marginTop: 4 },
});
