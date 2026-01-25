'use client';

import styles from './PaymentButton.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { type PaymentProduct, startCheckout } from '@/src/lib/payments';

type PaymentButtonProps = {
  product: PaymentProduct;
};

export default function PaymentButton({ product }: PaymentButtonProps) {
  const { t } = useI18n();

  return (
    <button type="button" className={styles.button} onClick={() => startCheckout(product, t)}>
      {t(I18N_KEYS.payment.payButton)}
    </button>
  );
}
