import { getSystemRuntimeSettings } from '../ops/systemConfig';
import {
  assertTossKeySafety,
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

  return resolveTossCheckoutAvailability(resolved.provider);
}

async function resolveTossCheckoutAvailability(
  provider: PaymentProviderName
): Promise<CheckoutAvailability> {
  const keys = await resolveTossRuntimeKeys();
  if (!keys.ok) {
    const code =
      keys.code === 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT' ||
      keys.code === 'PAYMENT_PROVIDER_CONFIG_INVALID'
        ? keys.code
        : 'FOREIGN_MID_NOT_CONFIGURED';
    return { provider, providerChargeReady: false, unavailableCode: code };
  }
  try {
    assertTossKeySafety(keys.clientKey, keys.secretKey);
  } catch {
    return {
      provider,
      providerChargeReady: false,
      unavailableCode: 'FOREIGN_MID_NOT_CONFIGURED',
    };
  }
  return { provider, providerChargeReady: true, unavailableCode: null };
}
