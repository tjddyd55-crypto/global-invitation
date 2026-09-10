'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { formatMoneyUsd, formatPaymentStatus } from '@/src/features/admin/adminDisplay';
import { getAdminOpsPayment } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type Props = {
  paymentId: string;
};

export default function PaymentDetailCard({ paymentId }: Props) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminOpsPayment(paymentId)
      .then((res) => setDetail((res.payment as Record<string, unknown>) || res))
      .catch((err) => setError(err instanceof Error ? err.message : '결제 상세를 불러오지 못했습니다.'));
  }, [paymentId]);

  if (error) return <p className={styles.pageDescription}>{error}</p>;
  if (!detail) return <p className={styles.pageDescription}>결제 상세를 불러오는 중…</p>;

  return (
    <article className={styles.card} style={{ marginTop: 16 }}>
      <h3>결제 상세</h3>
      <p>상태 {formatPaymentStatus(String(detail.status || ''))}</p>
      <p>결제금액 {formatMoneyUsd(Number(detail.chargedAmount || 0))}</p>
      <p>쿠폰 {String(detail.couponCode || '없음 (레거시 결제 가능)')}</p>
      <p>
        쿠폰 할인 {detail.discountAmountCents == null ? '—' : formatMoneyUsd(Number(detail.discountAmountCents))}
      </p>
      <p>기준금액 {detail.baseAmountCents == null ? '—' : formatMoneyUsd(Number(detail.baseAmountCents))}</p>
      <p>주문번호 {String(detail.orderId || '—')}</p>
      {detail.refundedAt ? (
        <p className={styles.pageDescription}>
          환불됨 {String(detail.refundedAt)}. 쿠폰 사용완료는 유지되며 재사용할 수 없습니다.
        </p>
      ) : null}
    </article>
  );
}
