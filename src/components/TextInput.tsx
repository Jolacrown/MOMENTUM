import React from 'react';
import { 
  View, 
  Text, 
  TextInput as RNTextInput, 
  StyleSheet, 
  TextInputProps as RNTextInputProps 
} from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[16],
    width: '100%',
  },
  label: {
    fontSize: typography.size.textsm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: radius.md,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    fontSize: typography.size.textbase,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error500,
  },
  errorText: {
    fontSize: typography.size.textxs,
    color: colors.error500,
    marginTop: spacing[4],
  },
  helperText: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
    marginTop: spacing[4],
  },
});
