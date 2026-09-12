import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { resetPasswordWithRecovery, mapAuthErrorCode } from '@/src/api/auth';
import { ApiError } from '@/src/api/client';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppPasswordInput } from '@/src/components/AppPasswordInput';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { useFormFocusChain } from '@/src/hooks/useFormFocusChain';
import { spacing } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const FIELDS = ['password', 'passwordConfirm'] as const;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recoveryToken?: string }>();
  const { setRef, focusNext } = useFormFocusChain(FIELDS);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (password !== passwordConfirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    const recoveryToken = params.recoveryToken ?? '';
    if (!recoveryToken) {
      setError('복구 토큰이 없습니다.');
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await resetPasswordWithRecovery(recoveryToken, password);
      if (!result.ok) {
        setError(mapAuthErrorCode(result.error));
        return;
      }
      router.replace({
        pathname: '/(auth)/recovery-code',
        params: { recoveryCode: result.newRecoveryCode },
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(mapAuthErrorCode(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader title={t('auth.resetPassword')} showBack />
      {error ? <FeedbackBanner message={error} variant="error" /> : null}
      <View style={styles.form}>
        <AppPasswordInput
          ref={setRef('password')}
          label={t('auth.newPassword')}
          value={password}
          onChangeText={setPassword}
          autoComplete="password-new"
          returnKeyType="next"
          onSubmitEditing={() => focusNext('password')}
        />
        <AppPasswordInput
          ref={setRef('passwordConfirm')}
          label={t('auth.passwordConfirm')}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          autoComplete="password-new"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        <AppButton label={t('auth.resetPassword')} onPress={onSubmit} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.lg },
});
