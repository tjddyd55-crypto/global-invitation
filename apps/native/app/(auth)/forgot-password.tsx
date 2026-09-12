import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { verifyRecovery, mapAuthErrorCode } from '@/src/api/auth';
import { ApiError } from '@/src/api/client';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { useFormFocusChain } from '@/src/hooks/useFormFocusChain';
import { spacing } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const FIELDS = ['username', 'email', 'recoveryCode'] as const;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { setRef, focusNext } = useFormFocusChain(FIELDS);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await verifyRecovery({
        username: username.trim(),
        email: email.trim(),
        recoveryCode: recoveryCode.trim(),
      });
      if (!result.ok) {
        setError(mapAuthErrorCode(result.error));
        return;
      }
      router.push({
        pathname: '/(auth)/reset-password',
        params: { recoveryToken: result.recoveryToken },
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
      <AppHeader title={t('auth.forgotPassword')} showBack />
      {error ? <FeedbackBanner message={error} variant="error" /> : null}
      <View style={styles.form}>
        <AppInput
          ref={setRef('username')}
          label={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => focusNext('username')}
        />
        <AppInput
          ref={setRef('email')}
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => focusNext('email')}
        />
        <AppInput
          ref={setRef('recoveryCode')}
          label={t('auth.recoveryCode')}
          value={recoveryCode}
          onChangeText={setRecoveryCode}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        <AppButton label={t('common.next')} onPress={onSubmit} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.lg },
});
