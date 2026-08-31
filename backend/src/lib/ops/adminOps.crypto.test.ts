import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encryptSecretToJson,
  decryptSecretFromJson,
  fingerprintSecret,
  maskSecret,
} from '../security/adminSettingsCrypto';
import {
  toInternationalUsdChargeAmount,
  resolveTossChargeAmount,
  getPrimaryPaymentChannel,
} from '../payments/provider';
import { INVITATION_PRICING, getCodeDefaultPricingSnapshot } from '../pricing/invitationPricing';

test('AES-GCM roundtrip encrypt/decrypt', () => {
  const prev = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  try {
    const blob = encryptSecretToJson('test_sk_demo_secret_value');
    assert.ok(!blob.includes('test_sk_demo'));
    assert.equal(decryptSecretFromJson(blob), 'test_sk_demo_secret_value');
  } finally {
    process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = prev;
  }
});

test('maskSecret never returns full secret', () => {
  const masked = maskSecret('test_sk_abcdefghijklmnop');
  assert.ok(masked);
  assert.ok(!masked!.includes('abcdefghijklmnop'));
  assert.ok(masked!.includes('•'));
});

test('fingerprint is stable short hash', () => {
  assert.equal(fingerprintSecret('abc'), fingerprintSecret('abc'));
  assert.notEqual(fingerprintSecret('abc'), fingerprintSecret('abcd'));
});

test('code default pricing remains USD 30/10', () => {
  const snap = getCodeDefaultPricingSnapshot();
  assert.equal(snap.currency, 'USD');
  assert.equal(snap.listPriceCents, 3000);
  assert.equal(snap.chargedAmountCents, 1000);
  assert.equal(snap.source, 'code_default');
});

test('dynamic sale amount maps without FX', () => {
  assert.deepEqual(toInternationalUsdChargeAmount(1100), { currency: 'USD', value: 11 });
  const charge = resolveTossChargeAmount('toss_payments', 1100);
  assert.equal(charge.ok, true);
  if (charge.ok) {
    assert.equal(charge.channel, 'INTERNATIONAL_USD');
    assert.equal(charge.amount.value, 11);
  }
});

test('canonical channel remains INTERNATIONAL_USD', () => {
  assert.equal(getPrimaryPaymentChannel(), 'INTERNATIONAL_USD');
  assert.equal(INVITATION_PRICING.currency, 'USD');
});
