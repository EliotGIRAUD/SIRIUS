import { TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../lib/theme';

interface Props extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: Props) {
  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.muted} {...props} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
  },
});
