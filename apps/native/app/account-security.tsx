import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { changePassword, mapAuthErrorCode, regenerateRecoveryCode } from '@/src/api/auth';
import { ApiError } from '@/src/api/client';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppPasswordInput } from '@/src/components/AppPasswordInput';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { useFormFocusChain } from '@/src/hooks/useFormFocusChain';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;

export default function AccountSecurityScreen() {
  const router = useRouter();
  const { setRef, focusNext } = useFormFocusChain(PASSWORD_FIELDS);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChangePassword = async () => {
    setError(null);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(mapAuthErrorCode(code));
    } finally {
      setLoading(false);
    }
  };

  const onRegenerateRecovery = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await regenerateRecoveryCode(recoveryPassword);
      setNewRecoveryCode(result.recoveryCode);
      setMessage('새 복구 코드가 발급되었습니다. 안전한 곳에 보관하세요.');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(mapAuthErrorCode(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader title={t('my.security')} showBack />
      {error ? <FeedbackBanner message={error} variant="error" /> : null}
      {message ? <FeedbackBanner message={message} variant="success" /> : null}

      <Text style={styles.sectionTitle}>비밀번호 변경</Text>
      <View style={styles.form}>
        <AppPasswordInput
          ref={setRef('currentPassword')}
          label={t('auth.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          returnKeyType="next"
          onSubmitEditing={() => focusNext('currentPassword')}
        />
        <AppPasswordInput
          ref={setRef('newPassword')}
          label={t('auth.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          autoComplete="password-new"
          returnKeyType="next"
          onSubmitEditing={() => focusNext('newPassword')}
        />
        <AppPasswordInput
          ref={setRef('confirmPassword')}
          label={t('auth.passwordConfirm')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoComplete="password-new"
          returnKeyType="done"
          onSubmitEditing={onChangePassword}
        />
        <AppButton label="비밀번호 변경" onPress={onChangePassword} loading={loading} />
      </View>

      <Text style={styles.sectionTitle}>{t('my.regenerateRecovery')}</Text>
      <View style={styles.form}>
        <AppPasswordInput
          label={t('auth.currentPassword')}
          value={recoveryPassword}
          onChangeText={setRecoveryPassword}
          returnKeyType="done"
          onSubmitEditing={onRegenerateRecovery}
        />
        <AppButton label={t('my.regenerateRecovery')} onPress={onRegenerateRecovery} variant="secondary" loading={loading} />
      </View>

      {newRecoveryCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>{t('auth.recoveryCode')}</Text>
          <Text style={styles.code} selectable>{newRecoveryCode}</Text>
          <AppButton
            label={t('auth.recoverySaved')}
            onPress={() =>
              router.push({ pathname: '/(auth)/recovery-code', params: { recoveryCode: newRecoveryCode } })
            }
            variant="secondary"
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.heading, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  codeBox: { marginTop: spacing.xl, gap: spacing.md },
  codeLabel: { ...typography.label, color: colors.textSecondary },
  code: { ...typography.heading, color: colors.text, letterSpacing: 2 },
});
