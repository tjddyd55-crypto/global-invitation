'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './PaymentPage.module.css';

type Props = { invitationId: string };

export default function PaymentFailPage({ invitationId }: Props) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const canceled = code === 'PAY_PROCESS_CANCELED';

  return (
    <div className={styles.page} data-testid="payment-fail-page" data-phase={canceled ? 'canceled' : 'failed'}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        <div className={styles.stateBlock} role={canceled ? 'status' : 'alert'}>
          <h1 className={styles.stateTitle}>
            {canceled ? t('checkout.canceled.title') : t('checkout.failed.title')}
          </h1>
          <p className={styles.stateBody}>
            {canceled ? t('checkout.canceled.body') : t('checkout.failed.body')}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={`/invitations/${invitationId}/payment`}>
              {t('checkout.cta.retry')}
            </Link>
            <Link className={styles.secondary} href={`/editor/${invitationId}`}>
              {t('checkout.cta.backEditor')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
