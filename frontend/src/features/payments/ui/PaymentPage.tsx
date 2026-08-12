'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
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
  | 'error';

type PaymentPageProps = {
  invitationId: string;
};

const MAX_POLLS = 20;
const POLL_MS = 1500;

export default function PaymentPage({ invitationId }: PaymentPageProps) {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<UiPhase>('loading');
  const [summary, setSummary] = useState<InvitationPaymentSummaryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const pollRef = useRef(0);
  const startedCheckout = useRef(false);

  const list = formatUsdFromCents(INVITATION_PRICING.listPriceCents);
  const sale = formatUsdFromCents(INVITATION_PRICING.salePriceCents);
  const discount = formatUsdFromCents(
    INVITATION_PRICING.listPriceCents - INVITATION_PRICING.salePriceCents
  );

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
      const prepared = await prepareInvitationPayment(invitationId);
      if (prepared.provider === 'mock') {
        redirectMockPaymentSuccess(prepared);
        return;
      }
      await requestTossPaymentWindow(prepared);
    } catch (error) {
      startedCheckout.current = false;
      setBusy(false);
      if (error instanceof Error && error.message === 'ALREADY_PAID') {
        setPhase('already_paid');
        return;
      }
      if (error instanceof Error && error.message === 'UNSUPPORTED_CURRENCY') {
        setPhase('failed');
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
      setCopyNotice('링크가 복사되었습니다');
      window.setTimeout(() => setCopyNotice(null), 2000);
    } catch {
      setCopyNotice('복사에 실패했습니다');
    }
  };

  const title = summary?.title?.trim() || '초대장';
  const publicHref = shareSlug ? `/i/${shareSlug}` : null;

  return (
    <div className={styles.page} data-testid="payment-page" data-phase={phase}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        {phase === 'loading' ? (
          <p className={styles.headerDesc} role="status">
            불러오는 중…
          </p>
        ) : null}

        {phase === 'error' ? (
          <div className={styles.stateBlock}>
            <h1 className={styles.stateTitle}>초대장을 불러오지 못했습니다</h1>
            <p className={styles.stateBody}>권한이 없거나 초대장이 없습니다.</p>
            <Link className={styles.primary} href="/my-invitations">
              내 초대장으로
            </Link>
          </div>
        ) : null}

        {phase === 'default' ? (
          <>
            <h1 className={styles.headerTitle}>초대장 발행하기</h1>
            <p className={styles.headerDesc}>결제가 완료되면 공개 링크가 활성화됩니다.</p>

            <section className={styles.card} aria-label="초대장 요약">
              <h2 className={styles.summaryTitle}>{title}</h2>
              <p className={styles.summaryMeta}>{summary?.templateKey}</p>
            </section>

            <section className={styles.card} aria-label="결제 금액">
              <div className={styles.priceRow}>
                <span className={styles.muted}>정상가</span>
                <span aria-label={`정상가 ${list}`}>{list}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.discount}>오픈 할인</span>
                <span className={styles.discount} aria-label={`오픈 할인 -${discount}`}>
                  -{discount}
                </span>
              </div>
              <div className={styles.priceRowTotal}>
                <span>결제금액</span>
                <span aria-label={`결제금액 ${sale}`}>{sale}</span>
              </div>
            </section>

            <section className={styles.card} aria-label="혜택">
              <ul className={styles.benefits}>
                <li>이 초대장을 공개할 수 있습니다.</li>
                <li>결제 후에도 자유롭게 수정할 수 있습니다.</li>
                <li>같은 초대장은 추가 결제가 없습니다.</li>
              </ul>
              <p className={styles.muted} style={{ marginTop: 12, marginBottom: 0, fontSize: '0.8125rem' }}>
                안전한 결제는 토스페이먼츠를 통해 처리됩니다.
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
                  {sale} 결제하고 발행하기
                </button>
              </div>
            </div>
          </>
        ) : null}

        {phase === 'processing' ? (
          <div className={styles.stateBlock} role="status" aria-live="polite">
            <h1 className={styles.stateTitle}>결제 처리 중…</h1>
            <p className={styles.stateBody}>
              결제를 확인하고 있습니다. 잠시만 기다려 주세요.
              <br />
              새로고침해도 결제 상태는 서버에서 복구됩니다.
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
              {publicHref ? (
                <Link className={styles.primary} href={publicHref} data-testid="payment-view-invitation">
                  초대장 보기
                </Link>
              ) : null}
              <button type="button" className={styles.secondary} onClick={() => void handleCopyLink()}>
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
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  startedCheckout.current = false;
                  setPhase('default');
                }}
              >
                다시 결제하기
              </button>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                초대장으로 돌아가기
              </Link>
            </div>
          </div>
        ) : null}

        {phase === 'canceled' ? (
          <div className={styles.stateBlock} role="status">
            <h1 className={styles.stateTitle}>결제가 취소되었습니다</h1>
            <p className={styles.stateBody}>작성한 초대장은 그대로 저장되어 있습니다.</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  startedCheckout.current = false;
                  setPhase('default');
                }}
              >
                다시 결제하기
              </button>
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                편집으로 돌아가기
              </Link>
            </div>
          </div>
        ) : null}

        {phase === 'already_paid' ? (
          <div className={styles.stateBlock} role="status">
            <h1 className={styles.stateTitle}>이 초대장은 이미 결제되었습니다</h1>
            <p className={styles.stateBody}>
              {summary?.isPublished
                ? '공개 링크를 확인하거나 초대장을 수정할 수 있습니다.'
                : '결제는 완료되었습니다. 발행을 완료해 주세요.'}
            </p>
            <div className={styles.actions}>
              {summary?.isPublished && publicHref ? (
                <Link className={styles.primary} href={publicHref}>
                  초대장 보기
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
                  발행 완료하기
                </button>
              )}
              {publicHref ? (
                <button type="button" className={styles.secondary} onClick={() => void handleCopyLink()}>
                  링크 복사
                </button>
              ) : null}
              <Link className={styles.secondary} href={`/editor/${invitationId}`}>
                초대장 수정하기
              </Link>
              {copyNotice ? <p className={styles.muted}>{copyNotice}</p> : null}
            </div>
          </div>
        ) : null}

        <p className={styles.headerDesc} style={{ marginTop: 28 }}>
          문의:{' '}
          <a href={supportMailtoHref()}>{SUPPORT_EMAIL}</a>
        </p>
      </main>
    </div>
  );
}
