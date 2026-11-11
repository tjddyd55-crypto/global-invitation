import { test } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../prisma';
import { invalidateSystemConfigCache } from '../ops/systemConfig';
import { resolvePrepareProvider } from './prepareProvider';

async function withSettings(enabled: boolean, rate: number | null, run: () => Promise<void>) {
  const provider = process.env.PAYMENT_PROVIDER;
  const environment = process.env.NODE_ENV;
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.NODE_ENV = 'test';
  Object.defineProperty(prisma.systemRuntimeConfig, 'upsert', { configurable: true, value: async () => ({}) });
  Object.defineProperty(prisma.systemRuntimeConfig, 'findUnique', { configurable: true, value: async () => ({ domesticKrwEnabled: enabled,
    usdKrwRate: rate, paymentsEnabled: true, publishingEnabled: true, invitationCreationEnabled: true,
    signupsEnabled: true, supportEmail: null, activePaymentEnvironment: 'TEST', updatedBy: null, updatedAt: new Date() }) });
  invalidateSystemConfigCache();
  try { await run(); } finally {
    Reflect.deleteProperty(prisma.systemRuntimeConfig, 'upsert');
    Reflect.deleteProperty(prisma.systemRuntimeConfig, 'findUnique');
    invalidateSystemConfigCache();
    if (provider === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = provider;
    if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment;
  }
}

test('domestic requires explicit enablement; overseas mock remains available', async () => {
  await withSettings(false, null, async () => {
    const domestic = await resolvePrepareProvider(false, 1000, { invitationId: 'id', checkoutMethod: 'DOMESTIC' });
    assert.equal(!domestic.ok && domestic.code, 'DOMESTIC_KRW_DISABLED');
    for (const checkoutMethod of ['OVERSEAS_CARD', 'OVERSEAS_EASY_PAY']) {
      const overseas = await resolvePrepareProvider(false, 1000, { invitationId: 'id', checkoutMethod, country: 'US' });
      assert.equal(overseas.ok && overseas.provider, 'mock');
      assert.deepEqual(overseas.ok && overseas.chargeAmount, { currency: 'USD', value: 10 });
    }
  });
});
test('missing rate rejects domestic; configured rate converts charged cents only', async () => {
  await withSettings(true, null, async () => {
    const result = await resolvePrepareProvider(false, 500, { invitationId: 'id', checkoutMethod: 'DOMESTIC' });
    assert.equal(!result.ok && result.code, 'DOMESTIC_KRW_RATE_NOT_CONFIGURED');
  });
  await withSettings(true, 1350, async () => {
    const result = await resolvePrepareProvider(false, 500, { invitationId: 'id', checkoutMethod: 'DOMESTIC' });
    assert.deepEqual(result.ok && result.chargeAmount, { currency: 'KRW', value: 6750 });
    assert.equal(result.ok && result.usdKrwRate, 1350);
    assert.equal(result.ok && result.paymentChannel, 'DOMESTIC_KRW');
  });
});
