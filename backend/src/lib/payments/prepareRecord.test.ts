import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { InvitationPayment } from '@prisma/client';
import prisma from '../prisma';
import { createOrReuseAttempt } from './prepareRecord';
import type { PrepareAttemptArgs } from './prepareTypes';

const args: PrepareAttemptArgs = {
  input: { invitationId: 'invitation', checkoutMethod: 'DOMESTIC' },
  pricing: { currency: 'USD', listPriceCents: 3000, chargedAmountCents: 1000,
    promotionCode: 'OPENING', source: 'code_default' },
  provider: 'mock', chargedAmountCents: 1000, snapshot: null,
  chargeAmount: { currency: 'KRW', value: 13500 }, usdKrwRate: 1350,
  paymentChannel: 'DOMESTIC_KRW', clientKey: null, variantKey: null, settlement: 'provider',
};

async function withPaymentStore(pending: InvitationPayment | null,
  run: (writes: Record<string, unknown>[]) => Promise<void>) {
  const writes: Record<string, unknown>[] = [];
  const originalTransaction = Object.getOwnPropertyDescriptor(prisma, '$transaction');
  Object.defineProperty(prisma.invitationPayment, 'findFirst', { configurable: true, value: async () => pending });
  Object.defineProperty(prisma.invitationPayment, 'create', { configurable: true,
    value: async ({ data }: { data: Record<string, unknown> }) => { writes.push(data); return { id: 'new_attempt' }; } });
  Object.defineProperty(prisma.invitationPayment, 'update', { configurable: true,
    value: async ({ data }: { data: Record<string, unknown> }) => { writes.push(data); return {}; } });
  Object.defineProperty(prisma, '$transaction', { configurable: true,
    value: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma) });
  try { await run(writes); } finally {
    for (const method of ['findFirst', 'create', 'update']) Reflect.deleteProperty(prisma.invitationPayment, method);
    if (originalTransaction) Object.defineProperty(prisma, '$transaction', originalTransaction);
    else Reflect.deleteProperty(prisma, '$transaction');
  }
}

test('prepare persists USD product cents and authoritative KRW metadata separately', async () => {
  await withPaymentStore(null, async writes => {
    const result = await createOrReuseAttempt(args);
    assert.equal(result.ok && !result.alreadyPaid && result.checkoutMethod, 'DOMESTIC');
    assert.deepEqual(result.ok && !result.alreadyPaid && result.amount, { currency: 'KRW', value: 13500 });
    assert.equal(writes[0].currency, 'USD');
    assert.equal(writes[0].chargedAmount, 1000);
    const meta = JSON.parse(String(writes[1].rawProviderStatus));
    assert.equal(meta.tossCurrency, 'KRW');
    assert.equal(meta.tossAmount, 13500);
    assert.equal(meta.usdKrwRate, 1350);
    assert.equal(meta.checkoutMethod, 'DOMESTIC');
  });
});
test('matching attempt reuses order; a different checkout method creates an attempt', async () => {
  const pending = { id: 'old_attempt', providerOrderId: 'old_order', couponId: null, couponCode: null,
    chargedAmount: 1000, currency: 'USD', rawProviderStatus: JSON.stringify({
      checkoutMethod: 'DOMESTIC', country: null, tossCurrency: 'KRW', tossAmount: 13500, usdKrwRate: 1350,
    }) } as InvitationPayment;
  await withPaymentStore(pending, async writes => {
    const reused = await createOrReuseAttempt(args);
    assert.equal(reused.ok && !reused.alreadyPaid && reused.orderId, 'old_order');
    assert.equal(writes.length, 0);
    const different = await createOrReuseAttempt({ ...args, input: { ...args.input, checkoutMethod: 'OVERSEAS_CARD' },
      chargeAmount: { currency: 'USD', value: 10 }, paymentChannel: 'INTERNATIONAL_USD', usdKrwRate: null });
    assert.equal(different.ok && !different.alreadyPaid && different.paymentId, 'new_attempt');
    assert.equal(writes.length, 2);
  });
});
