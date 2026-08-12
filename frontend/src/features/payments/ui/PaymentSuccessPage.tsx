'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import { publishInvitationById } from '@/src/lib/api';
import {
  confirmInvitationPayment,
  fetchInvitationPaymentStatus,
} from '@/src/shared/payments/invitationPaymentApi';
import styles from './PaymentPage.module.css';

type Props = { invitationId: string };

/**
 * Toss successUrl landing — authentication success ≠ paid.
 * Always confirm on backend, then publish.
 */
export default function PaymentSuccessPage({ invitationId }: Props) {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<'processing' | 'success' | 'failed'>('processing');
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const paymentKey = searchParams.get('paymentKey') || '';
    const orderId = searchParams.get('orderId') || '';
    const amount = Number(searchParams.get('amount'));

    const run = async () => {
      try {
        // Recovery: already PAID (refresh / double confirm)
        const existing = await fetchInvitationPaymentStatus(invitationId, { orderId });
        if (existing.isPaid) {
          const published = await publishInvitationById(invitationId);
          setShareSlug(published.shareSlug || null);
          setPhase('success');
          return;
        }

        if (!paymentKey || !orderId || !Number.isFinite(amount)) {
          setPhase('failed');
          return;
        }

        await confirmInvitationPayment(invitationId, { paymentKey, orderId, amount });
        const published = await publishInvitationById(invitationId);
        setShareSlug(published.shareSlug || null);
        setPhase('success');
      } catch {
        try {
          const status = await fetchInvitationPaymentStatus(invitationId, { orderId });
          if (status.isPaid) {
            const published = await publishInvitationById(invitationId);
            setShareSlug(published.shareSlug || null);
            setPhase('success');
            return;
          }
        } catch {
          // fall through
        }
        setPhase('failed');
      }
    };

    void run();
  }, [invitationId, searchParams]);

  const handleCopy = async () => {
    if (!shareSlug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/i/${shareSlug}`);
      setCopyNotice('링크가 복사되었습니다');
    } catch {
      setCopyNotice('복사에 실패했습니다');
    }
  };

  return (
    <div className={styles.page} data-testid="payment-success-page" data-phase={phase}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        {phase === 'processing' ? (
          <div className={styles.stateBlock} role="status" aria-live="polite">
            <h1 className={styles.stateTitle}>결제 처리 중…</h1>
            <p className={styles.stateBody}>
              결제를 확인하고 있습니다. 잠시만 기다려 주세요.
              <br />
              새로고침해도 서버 상태로 복구됩니다.
            </p>
            <button type="button" className={styles.primary} disabled>
              결제 처리 중…
            </button>
          </div>
        ) : null}

        {phase === 'success' ? (
          <div className={styles.stateBlock} role="status" aria-live="polite">
            <h1 className={styles.stateTitle}>결제가 완료되었습니다</h1>
            <p className={styles.stateBody}>초대장이 발행되었습니다.</p>
            <div className={styles.actions}>
              {shareSlug ? (
                <Link className={styles.primary} href={`/i/${shareSlug}`}>
                  초대장 보기
                </Link>
              ) : null}
              <button type="button" className={styles.secondary} onClick={() => void handleCopy()}>
                링크 복사
              </button>
              {copyNotice ? <p className={styles.muted}>{copyNotice}</p> : null}
            </div>
          </div>
        ) : null}

        {phase === 'failed' ? (
          <div className={styles.stateBlock} role="alert">
            <h1 className={styles.stateTitle}>결제를 완료하지 못했습니다</h1>
            <p className={styles.stateBody}>작성한 초대장은 그대로 저장되어 있습니다.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={`/invitations/${invitationId}/payment`}>
                다시 결제하기
              </Link>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                초대장으로 돌아가기
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
