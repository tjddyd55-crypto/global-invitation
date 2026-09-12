import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type Props = {
  message?: string;
};

export function LoadingState({ message }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  text: { ...typography.body, color: colors.textSecondary },
});
