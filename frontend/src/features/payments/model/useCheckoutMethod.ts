'use client';
import { useEffect, useState } from 'react';
import { resolveCheckoutSelection } from './checkoutState';
import type { CheckoutMethod } from '@/src/shared/payments/tossCheckoutMethod';

export function useCheckoutMethod() {
  const [choice, setChoice] = useState<CheckoutMethod | null>(null);
  const [browserDefault, setBrowserDefault] = useState<CheckoutMethod>('OVERSEAS_CARD');
  useEffect(() => {
    setBrowserDefault(resolveCheckoutSelection(null, navigator.language));
  }, []);
  const checkoutMethod = choice ?? browserDefault;
  const [country, setCountry] = useState('US');
  return { checkoutMethod, setCheckoutMethod: setChoice, country, setCountry };
}
