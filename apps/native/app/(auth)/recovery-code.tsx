import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function RecoveryCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recoveryCode?: string }>();
  const code = params.recoveryCode ?? '';
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!code) return;
    await Share.share({ message: code });
    setCopied(true);
  };

  return (
    <AppScreen>
      <Text style={styles.title}>{t('auth.recoveryCodeTitle')}</Text>
      <Text style={styles.desc}>{t('auth.recoveryCodeDesc')}</Text>
      {copied ? <FeedbackBanner message={t('common.copied')} variant="success" /> : null}
      <View style={styles.codeBox}>
        <Text style={styles.code} selectable>{code}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton label={t('common.copy')} onPress={onCopy} variant="secondary" />
        <AppButton label={t('auth.recoverySaved')} onPress={() => router.replace('/(auth)/login')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginTop: spacing.xxxl },
  desc: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.lg },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
  },
  code: { ...typography.heading, color: colors.text, textAlign: 'center', letterSpacing: 2 },
  actions: { gap: spacing.md },
});
