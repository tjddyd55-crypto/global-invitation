'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import { useI18n } from '@/src/contexts/I18nContext';
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
  const { t } = useI18n();
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
      setCopyNotice(t('checkout.copy.done'));
    } catch {
      setCopyNotice(t('checkout.copy.fail'));
    }
  };

  return (
    <div className={styles.page} data-testid="payment-success-page" data-phase={phase}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        {phase === 'processing' ? (
          <div className={styles.stateBlock} role="status" aria-live="polite">
            <h1 className={styles.stateTitle}>{t('checkout.confirming.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.confirming.body')}</p>
            <button type="button" className={styles.primary} disabled>
              {t('checkout.confirming.button')}
            </button>
          </div>
        ) : null}

        {phase === 'success' ? (
          <div className={styles.stateBlock} role="status" aria-live="polite">
            <h1 className={styles.stateTitle}>{t('checkout.success.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.success.body')}</p>
            <div className={styles.actions}>
              {shareSlug ? (
                <Link className={styles.primary} href={`/i/${shareSlug}`}>
                  {t('checkout.cta.view')}
                </Link>
              ) : null}
              <button type="button" className={styles.secondary} onClick={() => void handleCopy()}>
                {t('checkout.cta.copy')}
              </button>
              {copyNotice ? <p className={styles.muted}>{copyNotice}</p> : null}
            </div>
          </div>
        ) : null}

        {phase === 'failed' ? (
          <div className={styles.stateBlock} role="alert">
            <h1 className={styles.stateTitle}>{t('checkout.failed.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.failed.body')}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={`/invitations/${invitationId}/payment`}>
                {t('checkout.cta.retry')}
              </Link>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                {t('checkout.cta.backEditor')}
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
