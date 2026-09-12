import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { register, mapAuthErrorCode } from '@/src/api/auth';
import { ApiError } from '@/src/api/client';
import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { AppPasswordInput } from '@/src/components/AppPasswordInput';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { useFormFocusChain } from '@/src/hooks/useFormFocusChain';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const FIELDS = ['username', 'email', 'password', 'passwordConfirm'] as const;

export default function SignupScreen() {
  const router = useRouter();
  const { setRef, focusNext } = useFormFocusChain(FIELDS);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await register({ username: username.trim(), email: email.trim(), password });
      if (!result.ok) {
        setError(mapAuthErrorCode(result.error));
        return;
      }
      router.replace({
        pathname: '/(auth)/recovery-code',
        params: { recoveryCode: result.recoveryCode },
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(mapAuthErrorCode(code) || t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <Text style={styles.title}>{t('auth.signup')}</Text>
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
        <AppPasswordInput
          ref={setRef('password')}
          label={t('auth.password')}
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
        <AppButton label={t('auth.signup')} onPress={onSubmit} loading={loading} />
      </View>
      <Link href="/(auth)/login" style={styles.link}>{t('auth.hasAccount')}</Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.xxxl, marginBottom: spacing.xxl },
  form: { gap: spacing.lg },
  link: { ...typography.bodyMedium, color: colors.primary, marginTop: spacing.xxl, textAlign: 'center' },
});
