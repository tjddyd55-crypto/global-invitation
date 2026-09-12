import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { login, mapAuthErrorCode, fetchMe } from '@/src/api/auth';
import { ApiError } from '@/src/api/client';
import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { AppPasswordInput } from '@/src/components/AppPasswordInput';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { useFormFocusChain } from '@/src/hooks/useFormFocusChain';
import { persistToken, useAuthStore } from '@/src/stores/authStore';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const FIELDS = ['username', 'password'] as const;

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { setRef, focusNext } = useFormFocusChain(FIELDS);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await login(username.trim(), password);
      if (!result.ok || !result.token) {
        setError(mapAuthErrorCode(result.error));
        return;
      }
      await persistToken(result.token);
      const user = result.user ?? await fetchMe();
      setSession(result.token, user);
      router.replace('/(tabs)');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(mapAuthErrorCode(code) || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.brand}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>
      </View>

      {error ? <FeedbackBanner message={error} variant="error" /> : null}

      <View style={styles.form}>
        <AppInput
          ref={setRef('username')}
          label={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => focusNext('username')}
        />
        <AppPasswordInput
          ref={setRef('password')}
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        <AppButton label={t('auth.login')} onPress={onSubmit} loading={loading} />
      </View>

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          {t('auth.forgotPassword')}
        </Link>
        <Link href="/(auth)/signup" style={styles.link}>
          {t('auth.noAccount')}
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.huge, marginBottom: spacing.xxxl, gap: spacing.sm },
  brand: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.lg },
  links: { marginTop: spacing.xxl, gap: spacing.lg, alignItems: 'center' },
  link: { ...typography.bodyMedium, color: colors.primary },
});
