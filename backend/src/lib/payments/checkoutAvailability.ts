import { getSystemRuntimeSettings } from '../ops/systemConfig';
import {
  assertTossKeySafety,
  TossKeySafetyError,
  resolveTossRuntimeKeys,
  tryResolvePaymentProvider,
} from './provider';
import type { PaymentProviderName } from './types';

export type CheckoutAvailability = {
  provider: PaymentProviderName | 'unconfigured';
  providerChargeReady: boolean;
  unavailableCode: string | null;
};

export async function resolveCheckoutAvailability(): Promise<CheckoutAvailability> {
  const system = await getSystemRuntimeSettings();
  if (!system.paymentsEnabled) {
    return {
      provider: 'unconfigured',
      providerChargeReady: false,
      unavailableCode: 'PAYMENTS_DISABLED',
    };
  }

  const resolved = tryResolvePaymentProvider();
  if (!resolved.ok) {
    return {
      provider: 'unconfigured',
      providerChargeReady: false,
      unavailableCode: resolved.code,
    };
  }

  if (resolved.provider === 'mock' || resolved.provider === 'coupon') {
    return { provider: resolved.provider, providerChargeReady: true, unavailableCode: null };
  }

  return resolveTossCheckoutAvailability(resolved.provider, system.activePaymentEnvironment);
}

async function resolveTossCheckoutAvailability(
  provider: PaymentProviderName,
  environment: 'TEST' | 'LIVE'
): Promise<CheckoutAvailability> {
  const keys = await resolveTossRuntimeKeys();
  if (!keys.ok) {
    const code = keys.code;
    return { provider, providerChargeReady: false, unavailableCode: code };
  }
  try {
    assertTossKeySafety(keys.clientKey, keys.secretKey, environment);
  } catch (error) {
    if (!(error instanceof TossKeySafetyError)) throw error;
    return {
      provider,
      providerChargeReady: false,
      unavailableCode: error.code,
    };
  }
  return { provider, providerChargeReady: true, unavailableCode: null };
}
