'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketingDesktopHeader from '@/src/features/marketing/ui/MarketingDesktopHeader';
import styles from './PaymentPage.module.css';

type Props = { invitationId: string };

export default function PaymentFailPage({ invitationId }: Props) {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const canceled = code === 'PAY_PROCESS_CANCELED';

  return (
    <div className={styles.page} data-testid="payment-fail-page" data-phase={canceled ? 'canceled' : 'failed'}>
      <MarketingDesktopHeader showNav={false} />
      <main className={styles.main}>
        <div className={styles.stateBlock} role={canceled ? 'status' : 'alert'}>
          <h1 className={styles.stateTitle}>
            {canceled ? '결제가 취소되었습니다' : '결제를 완료하지 못했습니다'}
          </h1>
          <p className={styles.stateBody}>작성한 초대장은 그대로 저장되어 있습니다.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={`/invitations/${invitationId}/payment`}>
              다시 결제하기
            </Link>
            <Link className={styles.secondary} href={`/editor/${invitationId}`}>
              편집으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
