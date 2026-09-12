import { forwardRef, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useKeyboardFormScroll } from '@/src/components/KeyboardFormContext';
import { colors, radius, sizes, spacing, typography } from '@/src/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  fieldKey?: string;
};

export const AppInput = forwardRef<TextInput, Props>(function AppInput(
  { label, error, style, onFocus, multiline, returnKeyType, blurOnSubmit, fieldKey, ...rest },
  forwardedRef,
) {
  const wrapRef = useRef<View>(null);
  const keyboardForm = useKeyboardFormScroll();

  const handleFocus = useCallback(
    (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      if (wrapRef.current) {
        keyboardForm?.scrollToField(wrapRef.current);
      }
      onFocus?.(event);
    },
    [keyboardForm, onFocus],
  );

  const resolvedReturnKeyType = returnKeyType ?? (multiline ? 'default' : 'next');
  const resolvedBlurOnSubmit = blurOnSubmit ?? !multiline;

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={forwardedRef}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError, style]}
        onFocus={handleFocus}
        multiline={multiline}
        returnKeyType={resolvedReturnKeyType}
        blurOnSubmit={resolvedBlurOnSubmit}
        accessibilityLabel={fieldKey ?? label}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text },
  input: {
    minHeight: sizes.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  multiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.caption, color: colors.error },
});
