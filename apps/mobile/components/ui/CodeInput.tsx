import { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}

export function CodeInput({ length = 6, value, onChange }: Props) {
  const ref = useRef<TextInput>(null);
  const chars = value.padEnd(length, ' ').slice(0, length).split('');
  const boxSize = length > 6 ? 36 : 44;
  const fontSize = length > 6 ? 16 : 20;

  return (
    <View style={styles.row}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length))}
        style={styles.hidden}
        autoCapitalize="characters"
        keyboardType="default"
        maxLength={length}
      />
      {chars.map((c, i) => (
        <View
          key={i}
          style={[styles.box, { width: boxSize, height: boxSize + 8 }]}
          onTouchEnd={() => ref.current?.focus()}
        >
          <TextInput editable={false} style={[styles.char, { fontSize, width: boxSize - 4 }]} value={c.trim()} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 16 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  box: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  char: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', width: 40 },
});
