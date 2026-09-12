import { forwardRef, useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useKeyboardFormScroll } from '@/src/components/KeyboardFormContext';
import { colors, radius, sizes, spacing, typography } from '@/src/theme/tokens';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
  autoComplete?: 'password' | 'password-new' | 'off';
};

export const AppPasswordInput = forwardRef<TextInput, Props>(function AppPasswordInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error,
    autoComplete = 'password',
    onFocus,
    returnKeyType,
    blurOnSubmit,
    onSubmitEditing,
    ...rest
  },
  forwardedRef,
) {
  const [visible, setVisible] = useState(false);
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

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, error && styles.rowError]}>
        <TextInput
          ref={forwardedRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          style={styles.input}
          onFocus={handleFocus}
          returnKeyType={returnKeyType ?? 'next'}
          blurOnSubmit={blurOnSubmit ?? true}
          onSubmitEditing={onSubmitEditing}
          {...rest}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>{visible ? '숨기기' : '보기'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text },
  row: {
    minHeight: sizes.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
  },
  rowError: { borderColor: colors.error },
  input: { flex: 1, ...typography.body, color: colors.text },
  toggle: { paddingHorizontal: spacing.lg, minHeight: sizes.touchTarget, justifyContent: 'center' },
  toggleText: { ...typography.caption, color: colors.primary },
  error: { ...typography.caption, color: colors.error },
});
