'use client';
import { useEffect, useState } from 'react';
import { prepareInvitationPayment, type PreparePaymentResponse } from '@/src/shared/payments/invitationPaymentApi';
import type { CheckoutMethod } from '@/src/shared/payments/tossCheckoutMethod';

type Input = { invitationId: string; checkoutMethod: CheckoutMethod; country: string;
  couponCode?: string; locale: string; enabled: boolean };
export function useCheckoutQuote(input: Input) {
  const { invitationId, checkoutMethod, country, couponCode, locale, enabled } = input;
  const [result, setResult] = useState<{ key: string; prepared?: PreparePaymentResponse; error?: string } | null>(null);
  const key = JSON.stringify([invitationId, checkoutMethod, country, couponCode, locale]);
  useEffect(() => {
    if (!enabled) return;
    let canceled = false;
    const timer = window.setTimeout(() => {
      void prepareInvitationPayment(invitationId, { checkoutMethod, country, couponCode, locale }).then(
        prepared => { if (!canceled) setResult({ key, prepared }); },
        (error: Error & { code?: string }) => { if (!canceled) setResult({ key, error: error.code || error.message }); }
      );
    }, 250);
    return () => { canceled = true; window.clearTimeout(timer); };
  }, [invitationId, checkoutMethod, country, couponCode, locale, enabled, key]);
  return result?.key === key ? result : null;
}
