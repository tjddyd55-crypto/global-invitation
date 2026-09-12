import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchPaymentSummary, formatUsd, validateCoupon } from '@/src/api/payment';
import { isNativePaymentCtaEnabled, NATIVE_PAYMENT_MODE } from '@/src/config/payment';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { FeedbackBanner } from '@/src/components/FeedbackBanner';
import { LoadingState } from '@/src/components/LoadingState';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

export default function PaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const invitationId = id ?? '';
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [finalCents, setFinalCents] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment', invitationId],
    queryFn: () => fetchPaymentSummary(invitationId),
    enabled: Boolean(invitationId),
  });

  const couponMutation = useMutation({
    mutationFn: () => validateCoupon(invitationId, couponCode.trim()),
    onSuccess: (result) => {
      if (!result.ok) {
        setCouponMessage(result.error ?? '쿠폰을 적용할 수 없습니다.');
        return;
      }
      setFinalCents(result.finalAmountCents);
      setCouponMessage(`쿠폰 적용: ${formatUsd(result.discountAmountCents)} 할인`);
    },
    onError: () => setCouponMessage('쿠폰 검증에 실패했습니다.'),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const listCents = data.pricing.listPriceCents;
  const saleCents = finalCents ?? data.pricing.salePriceCents;
  const ctaEnabled = isNativePaymentCtaEnabled(data.checkout.providerChargeReady);

  return (
    <AppScreen>
      <AppHeader title={t('payment.title')} showBack />
      <View style={styles.card}>
        <Row label={t('payment.listPrice')} value={formatUsd(listCents, data.pricing.currency)} />
        <Row label={t('payment.discount')} value={formatUsd(listCents - saleCents, data.pricing.currency)} />
        <Row label={t('payment.total')} value={formatUsd(saleCents, data.pricing.currency)} bold />
      </View>

      <AppInput label={t('payment.coupon')} value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
      <AppButton label={t('payment.applyCoupon')} onPress={() => couponMutation.mutate()} loading={couponMutation.isPending} variant="secondary" />
      {couponMessage ? <FeedbackBanner message={couponMessage} variant="info" /> : null}

      {!ctaEnabled ? (
        <FeedbackBanner
          message={data.checkout.message ?? t('payment.unavailableDesc')}
          variant="warning"
        />
      ) : null}

      <AppButton
        label={ctaEnabled ? '결제 진행' : t('payment.unavailable')}
        disabled={!ctaEnabled}
        onPress={() => {
          if (ctaEnabled) router.push(`/payment-success/${invitationId}`);
        }}
      />

      {NATIVE_PAYMENT_MODE === 'DISABLED_PENDING_POLICY' ? (
        <Text style={styles.policyNote}>{t('payment.unavailableDesc')}</Text>
      ) : null}
    </AppScreen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.text },
  rowValueBold: { fontWeight: '700', color: colors.primary },
  policyNote: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg },
});
