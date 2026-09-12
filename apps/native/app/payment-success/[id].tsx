import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { fetchPaymentSummary } from '@/src/api/payment';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppScreen } from '@/src/components/AppScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { LoadingState } from '@/src/components/LoadingState';
import { colors, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const invitationId = id ?? '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment', invitationId, 'success'],
    queryFn: () => fetchPaymentSummary(invitationId),
    enabled: Boolean(invitationId),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const isPaid = data.payment?.status === 'PAID' || data.payment?.paidAt;

  if (!isPaid) {
    return (
      <AppScreen>
        <AppHeader title={t('payment.successTitle')} showBack />
        <ErrorState
          message="결제 완료가 확인되지 않았습니다. 실제 결제 없이 이 화면에 진입할 수 없습니다."
          onRetry={() => router.back()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title={t('payment.successTitle')} showBack />
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('payment.successTitle')}</Text>
        <Text style={styles.desc}>{t('payment.successDesc')}</Text>
        <AppButton label={t('payment.goShare')} onPress={() => router.replace(`/editor/${invitationId}`)} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.huge, gap: spacing.lg },
  title: { ...typography.title, color: colors.text },
  desc: { ...typography.body, color: colors.textSecondary },
});
