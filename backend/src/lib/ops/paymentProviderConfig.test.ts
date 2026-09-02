import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deserializeStoredValue,
  serializeStoredValue,
} from './paymentProviderConfig';

test('serializeStoredValue stores client key in plain wrapper when encryption key missing', () => {
  const prev = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  delete process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  try {
    const stored = serializeStoredValue('test_ck_fixture', { requireEncryption: false });
    const parsed = JSON.parse(stored) as { v: number; pt: string };
    assert.equal(parsed.v, 0);
    assert.equal(parsed.pt, 'test_ck_fixture');
    assert.equal(deserializeStoredValue(stored), 'test_ck_fixture');
  } finally {
    process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = prev;
  }
});

test('serializeStoredValue encrypts secret when encryption key is configured', () => {
  const prev = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  process.env.ADMIN_SETTINGS_ENCRYPTION_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  try {
    const stored = serializeStoredValue('test_sk_fixture', { requireEncryption: true });
    assert.doesNotMatch(stored, /test_sk_fixture/);
    assert.equal(deserializeStoredValue(stored), 'test_sk_fixture');
  } finally {
    process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = prev;
  }
});

test('serializeStoredValue rejects secret without encryption key', () => {
  const prev = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  delete process.env.ADMIN_SETTINGS_ENCRYPTION_KEY;
  try {
    assert.throws(
      () => serializeStoredValue('test_sk_fixture', { requireEncryption: true }),
      /ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED/
    );
  } finally {
    process.env.ADMIN_SETTINGS_ENCRYPTION_KEY = prev;
  }
});
