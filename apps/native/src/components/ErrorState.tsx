import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{message ?? t('common.errorGeneric')}</Text>
      {onRetry ? <AppButton label={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  title: { ...typography.body, color: colors.text, textAlign: 'center' },
});
