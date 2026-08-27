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
import {
  formatUsdAmountLabel,
  formatUsdFromCents,
  INVITATION_PRICING,
} from '@/src/shared/pricing/invitationPricing';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
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
  const pollRef = useRef(0);
  const startedCheckout = useRef(false);

  const list = formatUsdAmountLabel(INVITATION_PRICING.listPriceCents);
  const sale = formatUsdAmountLabel(INVITATION_PRICING.salePriceCents);
  const discount = formatUsdFromCents(
    INVITATION_PRICING.listPriceCents - INVITATION_PRICING.salePriceCents
  );
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
  }, [invitationId, publishAfterPaid, searchParams]);

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
      const prepared = await prepareInvitationPayment(invitationId, { locale: productLocale });
      if (prepared.provider === 'mock') {
        redirectMockPaymentSuccess(prepared);
        return;
      }
      await requestTossPaymentWindow(prepared, { locale: productLocale });
    } catch (error) {
      startedCheckout.current = false;
      setBusy(false);
      if (error instanceof Error && error.message === 'ALREADY_PAID') {
        setPhase('already_paid');
        return;
      }
      if (
        error instanceof Error &&
        (error.message === 'FOREIGN_MID_NOT_CONFIGURED' ||
          error.message === 'MISSING_TOSS_KEYS' ||
          error.message === 'DOMESTIC_KRW_DISABLED' ||
          error.message === 'UNSUPPORTED_CURRENCY')
      ) {
        setPhase('unavailable');
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
          <>
            <h1 className={styles.headerTitle}>{t('checkout.title')}</h1>
            <p className={styles.headerDesc}>{t('checkout.lead')}</p>

            <section className={styles.card} aria-label={t('checkout.summaryAria')}>
              <h2 className={styles.summaryTitle}>{title}</h2>
              <p className={styles.summaryMeta}>{summary?.templateKey}</p>
            </section>

            <section className={styles.card} aria-label={t('checkout.priceAria')}>
              <div className={styles.priceRow}>
                <span className={styles.muted}>{t('checkout.listPrice')}</span>
                <span aria-label={`${t('checkout.listPrice')} ${list}`}>{list}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.discount}>{t('checkout.launchPrice')}</span>
                <span className={styles.discount} aria-label={`${t('checkout.launchPrice')} -${discount}`}>
                  -{discount}
                </span>
              </div>
              <div className={styles.priceRowTotal}>
                <span>{t('checkout.due')}</span>
                <span aria-label={`${t('checkout.due')} ${sale}`}>{sale}</span>
              </div>
            </section>

            <section className={styles.card} aria-label={t('checkout.benefitsAria')}>
              <ul className={styles.benefits}>
                <li>{t('checkout.benefit.publish')}</li>
                <li>{t('checkout.benefit.edit')}</li>
                <li>{t('checkout.benefit.once')}</li>
              </ul>
              <p className={styles.muted} style={{ marginTop: 12, marginBottom: 0, fontSize: '0.8125rem' }}>
                {t('checkout.providerNote')}
              </p>
            </section>

            <div className={styles.stickyBar}>
              <div className={styles.stickyInner}>
                <button
                  type="button"
                  className={styles.primary}
                  style={{ width: '100%' }}
                  disabled={busy}
                  data-testid="payment-checkout-cta"
                  onClick={() => void handleCheckout()}
                >
                  {`${sale} · ${t('checkout.cta.payPublish')}`}
                </button>
              </div>
            </div>
          </>
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
