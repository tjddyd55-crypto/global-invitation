'use client';
import { useI18n } from '@/src/contexts/I18nContext';
import type { CheckoutMethod } from '@/src/shared/payments/tossCheckoutMethod';
import styles from './PaymentPage.module.css';
import methodStyles from './PaymentMethodSelector.module.css';

type Props = { method: CheckoutMethod; country: string; disabled: boolean;
  onMethod: (method: CheckoutMethod) => void; onCountry: (country: string) => void };
const METHODS: CheckoutMethod[] = ['DOMESTIC', 'OVERSEAS_CARD', 'OVERSEAS_EASY_PAY'];
const COUNTRIES = ['US', 'MN', 'JP', 'PH', 'AU', 'CA', 'GB', 'SG', 'HK', 'TW', 'VN', 'TH', 'ID', 'MY', 'DE', 'FR'];

export default function PaymentMethodSelector(props: Props) {
  const { t, language } = useI18n();
  const regions = new Intl.DisplayNames([language], { type: 'region' });
  return <fieldset className={styles.card} disabled={props.disabled}>
    <legend>{t('checkout.method.title')}</legend>
    {METHODS.map(method => <label key={method} className={methodStyles.option}>
      <input type="radio" name="checkoutMethod" checked={props.method === method}
        onChange={() => props.onMethod(method)} /> {t(`checkout.method.${method}`)}
      <small className={methodStyles.hint}>{t(method === 'DOMESTIC' ? 'checkout.method.krwHint' : 'checkout.method.usdHint')}</small>
    </label>)}
    {props.method === 'OVERSEAS_EASY_PAY' && <label>{t('checkout.method.country')}
      <select value={props.country} onChange={event => props.onCountry(event.target.value)}>
        {COUNTRIES.map(country => <option key={country} value={country}>{regions.of(country)}</option>)}
      </select>
    </label>}
  </fieldset>;
}
