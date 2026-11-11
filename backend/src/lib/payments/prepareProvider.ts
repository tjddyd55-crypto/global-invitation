import { convertUsdCentsToKrw, isValidUsdKrwRate, parseCheckoutMethod } from './checkoutMethod';
import { getSystemRuntimeSettings } from '../ops/systemConfig';
import { assertTossKeySafety, resolveTossChargeAmount, resolveTossRuntimeKeys, tryResolvePaymentProvider } from './provider';
import type { PrepareInput } from './prepareTypes';
import type { PaymentChannel, PaymentProviderName, PreparePaymentResult, TossChargeAmount } from './types';

type PrepareFailure = Extract<PreparePaymentResult, { ok: false }>;
type ReadyProvider = { ok: true; provider: PaymentProviderName; chargeAmount: TossChargeAmount;
  usdKrwRate: number | null; paymentChannel: PaymentChannel; clientKey: string | null; variantKey: string | null };

export async function resolvePrepareProvider(
  isZero: boolean,
  chargedAmountCents: number,
  input: PrepareInput
): Promise<ReadyProvider | PrepareFailure> {
  const system = await getSystemRuntimeSettings();
  const domestic = parseCheckoutMethod(input.checkoutMethod) === 'DOMESTIC';
  if (domestic && !isZero && !system.domesticKrwEnabled) {
    return { ok: false, code: 'DOMESTIC_KRW_DISABLED', message: 'Domestic KRW checkout is disabled' };
  }
  if (domestic && !isZero && !isValidUsdKrwRate(system.usdKrwRate)) {
    return { ok: false, code: 'DOMESTIC_KRW_RATE_NOT_CONFIGURED', message: 'Configure the USD/KRW rate first' };
  }
  const providerResolved = tryResolvePaymentProvider();
  if (!isZero && !providerResolved.ok) {
    return { ok: false, code: providerResolved.code, message: providerResolved.message };
  }
  const provider = providerResolved.ok ? providerResolved.provider : 'coupon';
  let amount: TossChargeAmount;
  if (isZero) amount = { currency: domestic ? 'KRW' : 'USD', value: 0 };
  else if (domestic) amount = { currency: 'KRW', value: convertUsdCentsToKrw(chargedAmountCents, system.usdKrwRate!) };
  else {
    const usd = resolveTossChargeAmount(provider, chargedAmountCents);
    if (!usd.ok) return { ok: false, code: usd.code, message: usd.message };
    amount = usd.amount;
  }
  const providerCharge = { amount, channel: domestic ? 'DOMESTIC_KRW' as const : 'INTERNATIONAL_USD' as const };
  const keys = await loadProviderKeys(provider, isZero);
  if (!keys.ok) return keys;
  return {
    ok: true,
    provider,
    chargeAmount: providerCharge.amount,
    usdKrwRate: domestic ? system.usdKrwRate : null,
    paymentChannel: providerCharge.channel,
    clientKey: keys.clientKey,
    variantKey: keys.variantKey,
  };
}

async function loadProviderKeys(
  provider: PaymentProviderName,
  isZero: boolean
): Promise<
  | { ok: true; clientKey: string | null; variantKey: string | null }
  | Extract<PreparePaymentResult, { ok: false }>
> {
  if (isZero || provider !== 'toss_payments') {
    return { ok: true, clientKey: null, variantKey: null };
  }
  const keys = await resolveTossRuntimeKeys();
  if (!keys.ok) {
    return {
      ok: false,
      code: keys.code === 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT' ? keys.code : 'FOREIGN_MID_NOT_CONFIGURED',
      message: keys.message,
    };
  }
  try {
    assertTossKeySafety(keys.clientKey, keys.secretKey);
  } catch (error) {
    return {
      ok: false,
      code: 'FOREIGN_MID_NOT_CONFIGURED',
      message: error instanceof Error ? error.message : 'Toss USD MID key validation failed',
    };
  }
  return { ok: true, clientKey: keys.clientKey, variantKey: keys.variantKey };
}

