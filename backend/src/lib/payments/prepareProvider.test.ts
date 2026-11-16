import { test } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../prisma';
import { invalidateSystemConfigCache } from '../ops/systemConfig';
import { resolveTossCredentialsForRuntime } from '../ops/paymentProviderConfig';
import { resolveCheckoutAvailability } from './checkoutAvailability';
import { confirmTossPayment } from './tossClient';
import { resolvePrepareProvider } from './prepareProvider';

async function withSettings(enabled: boolean, rate: number | null, run: () => Promise<void>, options: { nodeEnv?: string; active?: 'TEST' | 'LIVE' } = {}) {
  const provider = process.env.PAYMENT_PROVIDER;
  const environment = process.env.NODE_ENV;
  process.env.PAYMENT_PROVIDER = options.nodeEnv ? 'toss_payments' : 'mock';
  process.env.NODE_ENV = options.nodeEnv || 'test';
  Object.defineProperty(prisma.systemRuntimeConfig, 'upsert', { configurable: true, value: async () => ({}) });
  Object.defineProperty(prisma.systemRuntimeConfig, 'findUnique', { configurable: true, value: async () => ({ domesticKrwEnabled: enabled,
    usdKrwRate: rate, paymentsEnabled: true, publishingEnabled: true, invitationCreationEnabled: true,
    signupsEnabled: true, supportEmail: null, activePaymentEnvironment: options.active || 'TEST', updatedBy: null, updatedAt: new Date() }) });
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

async function withSyntheticCredentials(clientPrefix: string, secretPrefix: string, run: () => Promise<void>) {
  Object.defineProperty(prisma.paymentProviderConfig, 'findUnique', { configurable: true, value: async () => ({
    enabled: true,
    encryptedClientKey: JSON.stringify({ v: 0, pt: clientPrefix + '_' }),
    encryptedSecretKey: JSON.stringify({ v: 0, pt: secretPrefix + '_' }),
  }) });
  try { await run(); } finally { Reflect.deleteProperty(prisma.paymentProviderConfig, 'findUnique'); }
}

for (const [nodeEnv, active, client, secret, code] of [
  ['production', 'TEST', 'test', 'test', null],
  ['production', 'LIVE', 'test', 'test', 'TOSS_TEST_KEY_FORBIDDEN_IN_PRODUCTION'],
  ['production', 'TEST', 'live', 'live', 'TOSS_LIVE_KEY_FORBIDDEN_IN_TEST'],
  ['development', 'TEST', 'live', 'live', 'TOSS_LIVE_KEY_FORBIDDEN_IN_NON_PRODUCTION'],
  ['production', 'TEST', 'test', 'live', 'TOSS_KEY_MISMATCH'],
] as const) {
  test('runtime, availability and prepare agree: ' + [nodeEnv, active, client, secret].join('/'), async () => {
    await withSettings(true, 1350, async () => {
      await withSyntheticCredentials(client, secret, async () => {
        const credentials = await resolveTossCredentialsForRuntime();
        assert.equal(credentials.ok, !code);
        if (!credentials.ok) assert.equal(credentials.code, code);
        const checkout = await resolveCheckoutAvailability();
        assert.equal(checkout.providerChargeReady, !code);
        assert.equal(checkout.unavailableCode, code);
        for (const checkoutMethod of ['DOMESTIC', 'OVERSEAS_CARD', 'OVERSEAS_EASY_PAY']) {
          const result = await resolvePrepareProvider(false, 500, { invitationId: 'id', checkoutMethod, country: 'US' });
          assert.equal(result.ok, !code);
          if (!result.ok) { assert.equal(result.code, code); continue; }
          assert.equal(result.provider, 'toss_payments');
          assert.equal(result.paymentEnvironment, 'TEST');
          assert.equal(result.clientKey?.startsWith('test_'), true);
          assert.deepEqual(result.chargeAmount, checkoutMethod === 'DOMESTIC'
            ? { currency: 'KRW', value: 6750 } : { currency: 'USD', value: 5 });
        }
      });
    }, { nodeEnv, active });
  });
}

test('production TEST confirm uses Toss endpoint; unsafe credentials never reach fetch', async () => {
  await withSettings(true, 1350, async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.tosspayments.com/v1/payments/confirm');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { paymentKey: 'synthetic-payment', orderId: 'synthetic-order', amount: 6750 });
      return new Response(JSON.stringify({ status: 'DONE', totalAmount: 6750, currency: 'KRW' }), { status: 200 });
    };
    try {
      const confirm = () => confirmTossPayment({ paymentKey: 'synthetic-payment', orderId: 'synthetic-order', amount: 6750, idempotencyKey: 'synthetic-id' });
      await withSyntheticCredentials('test', 'test', async () => { assert.equal((await confirm()).ok, true); });
      await withSyntheticCredentials('live', 'live', async () => {
        const rejected = await confirm();
        assert.equal(!rejected.ok && rejected.code, 'TOSS_LIVE_KEY_FORBIDDEN_IN_TEST');
      });
      assert.equal(calls, 1);
    } finally { globalThis.fetch = originalFetch; }
  }, { nodeEnv: 'production', active: 'TEST' });
});
