'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import { useI18n } from '@/src/contexts/I18nContext';
import { publishInvitationById } from '@/src/lib/api';
import {
  fetchInvitationPaymentStatus,
  fetchInvitationPaymentSummary,
  prepareInvitationPayment,
  type InvitationPaymentSummaryResponse,
} from '@/src/shared/payments/invitationPaymentApi';
import {
  redirectMockPaymentSuccess,
  requestTossPaymentWindow,
} from '@/src/shared/payments/tossPaymentClient';
import { INVITATION_PRICING } from '@/src/shared/pricing/invitationPricing';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import { settleZeroInvitationPayment } from '@/src/shared/payments/invitationCouponApi';
import {
  isProviderUnavailableCode,
  restorePendingCoupon,
} from '@/src/features/payments/model/checkoutState';
import PaymentCheckoutPanel from './PaymentCheckoutPanel';
import type { AppliedCoupon } from './PaymentCouponField';
import styles from './PaymentPage.module.css';

type UiPhase =
  | 'loading'
  | 'default'
  | 'processing'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'already_paid'
  | 'unavailable'
  | 'error';

type PaymentPageProps = {
  invitationId: string;
};

const MAX_POLLS = 20;
const POLL_MS = 1500;

export default function PaymentPage({ invitationId }: PaymentPageProps) {
  const { t, language } = useI18n();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<UiPhase>('loading');
  const [summary, setSummary] = useState<InvitationPaymentSummaryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);
  const pollRef = useRef(0);
  const startedCheckout = useRef(false);

  const listCents = summary?.pricing.listPriceCents ?? INVITATION_PRICING.listPriceCents;
  const saleCents = summary?.pricing.salePriceCents ?? INVITATION_PRICING.salePriceCents;
  const productLocale = language === 'en' ? 'en-US' : 'ko-KR';

  const publishAfterPaid = useCallback(async () => {
    const published = await publishInvitationById(invitationId);
    setShareSlug(published.shareSlug || null);
    setPhase('success');
  }, [invitationId]);

  const loadSummary = useCallback(async () => {
    const data = await fetchInvitationPaymentSummary(invitationId);
    setSummary(data);
    setShareSlug(data.shareSlug);
    setUnavailableMessage(
      data.checkout?.unavailableCode
        ? data.checkout.message || t('checkout.unavailable.banner')
        : null
    );
    const pendingCoupon = restorePendingCoupon(data);
    if (pendingCoupon) setAppliedCoupon(pendingCoupon);

    const statusParam = searchParams.get('status');
    if (data.payment.isPaid) {
      if (data.isPublished) {
        setPhase('already_paid');
      } else {
        setPhase('processing');
        try {
          await publishAfterPaid();
        } catch {
          setPhase('already_paid');
        }
      }
      return;
    }

    if (statusParam === 'processing') {
      setPhase('processing');
      return;
    }
    if (statusParam === 'canceled') {
      setPhase('canceled');
      return;
    }
    if (statusParam === 'failed') {
      setPhase('failed');
      return;
    }
    setPhase('default');
  }, [invitationId, publishAfterPaid, searchParams, t]);

  useEffect(() => {
    void loadSummary().catch(() => setPhase('error'));
  }, [loadSummary]);

  useEffect(() => {
    if (phase !== 'processing') return;

    let cancelled = false;
    pollRef.current = 0;

    const tick = async () => {
      if (cancelled) return;
      pollRef.current += 1;
      try {
        const paymentId = searchParams.get('paymentId');
        const status = await fetchInvitationPaymentStatus(invitationId, { paymentId });
        if (status.isPaid || status.status === 'PAID') {
          await publishAfterPaid();
          return;
        }
        if (status.status === 'FAILED') {
          setPhase('failed');
          return;
        }
        if (status.status === 'CANCELED') {
          setPhase('canceled');
          return;
        }
      } catch {
        // keep polling briefly
      }

      if (pollRef.current >= MAX_POLLS) {
        setPhase('processing');
        return;
      }
      window.setTimeout(() => {
        void tick();
      }, POLL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [phase, invitationId, publishAfterPaid, searchParams]);

  const handleCheckout = async () => {
    if (busy || startedCheckout.current) return;
    startedCheckout.current = true;
    setBusy(true);
    try {
      const prepared = await prepareInvitationPayment(invitationId, {
        locale: productLocale,
        couponCode: appliedCoupon?.code || null,
      });
      if (prepared.settlement === 'zero_coupon' || prepared.provider === 'coupon') {
        await settleZeroInvitationPayment(invitationId, prepared.paymentId);
        await publishAfterPaid();
        return;
      }
      if (prepared.provider === 'mock') {
        redirectMockPaymentSuccess(prepared);
        return;
      }
      await requestTossPaymentWindow(prepared, { locale: productLocale });
    } catch (error) {
      startedCheckout.current = false;
      setBusy(false);
      if (error instanceof Error && (error.message === 'ALREADY_PAID' || error.message === 'COUPON_ALREADY_PAID')) {
        setPhase('already_paid');
        return;
      }
      if (error instanceof Error && isProviderUnavailableCode(error.message)) {
        setUnavailableMessage(t('checkout.unavailable.banner'));
        setPhase('default');
        return;
      }
      setPhase('failed');
    }
  };

  const handleCopyLink = async () => {
    if (!shareSlug) return;
    const url = `${window.location.origin}/i/${shareSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyNotice(t('checkout.copy.done'));
      window.setTimeout(() => setCopyNotice(null), 2000);
    } catch {
      setCopyNotice(t('checkout.copy.fail'));
    }
  };

  const title = summary?.title?.trim() || t('checkout.invitationFallback');
  const publicHref = shareSlug ? `/i/${shareSlug}` : null;

  return (
    <div className={styles.page} data-testid="payment-page" data-phase={phase}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        {phase === 'loading' ? (
          <p className={styles.headerDesc} role="status">
            {t('checkout.loading')}
          </p>
        ) : null}

        {phase === 'error' ? (
          <div className={styles.stateBlock}>
            <h1 className={styles.stateTitle}>{t('checkout.error.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.error.body')}</p>
            <Link className={styles.primary} href="/my-invitations">
              {t('checkout.cta.myInvitations')}
            </Link>
          </div>
        ) : null}

        {phase === 'default' ? (
          <PaymentCheckoutPanel
            invitationId={invitationId}
            title={title}
            templateKey={summary?.templateKey}
            listCents={listCents}
            saleCents={saleCents}
            applied={appliedCoupon}
            busy={busy}
            providerChargeReady={summary?.checkout?.providerChargeReady !== false}
            unavailableMessage={unavailableMessage}
            onApplied={setAppliedCoupon}
            onRemoved={() => setAppliedCoupon(null)}
            onCheckout={() => void handleCheckout()}
          />
        ) : null}

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
              {publicHref ? (
                <Link className={styles.primary} href={publicHref} data-testid="payment-view-invitation">
                  {t('checkout.cta.view')}
                </Link>
              ) : null}
              <button type="button" className={styles.secondary} onClick={() => void handleCopyLink()}>
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
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  startedCheckout.current = false;
                  setPhase('default');
                }}
              >
                {t('checkout.cta.retry')}
              </button>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                {t('checkout.cta.backEditor')}
              </Link>
            </div>
          </div>
        ) : null}

        {phase === 'canceled' ? (
          <div className={styles.stateBlock} role="status">
            <h1 className={styles.stateTitle}>{t('checkout.canceled.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.canceled.body')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  startedCheckout.current = false;
                  setPhase('default');
                }}
              >
                {t('checkout.cta.retry')}
              </button>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                {t('checkout.cta.backEditor')}
              </Link>
            </div>
          </div>
        ) : null}

        {phase === 'unavailable' ? (
          <div className={styles.stateBlock} role="status">
            <h1 className={styles.stateTitle}>{t('checkout.unavailable.title')}</h1>
            <p className={styles.stateBody}>{t('checkout.unavailable.body')}</p>
            <div className={styles.actions}>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                {t('checkout.cta.backEditor')}
              </Link>
            </div>
          </div>
        ) : null}

        {phase === 'already_paid' ? (
          <div className={styles.stateBlock} role="status">
            <h1 className={styles.stateTitle}>{t('checkout.alreadyPaid.title')}</h1>
            <p className={styles.stateBody}>
              {summary?.isPublished
                ? t('checkout.alreadyPaid.published')
                : t('checkout.alreadyPaid.unpublished')}
            </p>
            <div className={styles.actions}>
              {summary?.isPublished && publicHref ? (
                <Link className={styles.primary} href={publicHref}>
                  {t('checkout.cta.view')}
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setPhase('processing');
                    void publishAfterPaid().catch(() => setPhase('failed'));
                  }}
                >
                  {t('checkout.cta.finishPublish')}
                </button>
              )}
              {publicHref ? (
                <button type="button" className={styles.secondary} onClick={() => void handleCopyLink()}>
                  {t('checkout.cta.copy')}
                </button>
              ) : null}
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                {t('checkout.cta.edit')}
              </Link>
              {copyNotice ? <p className={styles.muted}>{copyNotice}</p> : null}
            </div>
          </div>
        ) : null}

        <p className={styles.headerDesc} style={{ marginTop: 28 }}>
          {t('checkout.supportPrefix')}{' '}
          <a href={supportMailtoHref()}>{SUPPORT_EMAIL}</a>
        </p>
      </main>
    </div>
  );
}
