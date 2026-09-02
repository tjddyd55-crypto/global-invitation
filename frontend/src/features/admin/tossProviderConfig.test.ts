import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTossProviderPayload,
  mapTossProviderError,
  validateTossSaveDraft,
} from './tossProviderConfig';

test('buildTossProviderPayload includes only non-empty fields', () => {
  const payload = buildTossProviderPayload('TEST', {
    clientKey: 'test_ck_fixture',
    secretKey: '',
    variantKey: 'variant_fixture',
  });
  assert.equal(payload.environment, 'TEST');
  assert.equal(payload.enabled, true);
  assert.equal(payload.clientKey, 'test_ck_fixture');
  assert.equal(payload.variantKey, 'variant_fixture');
  assert.equal('secretKey' in payload, false);
});

test('validateTossSaveDraft blocks secret when encryption is missing', () => {
  const result = validateTossSaveDraft(
    { clientKey: '', secretKey: 'test_sk_fixture', variantKey: '' },
    false
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /암호화 설정이 없어 Secret Key/);
  }
});

test('validateTossSaveDraft allows client-only without encryption', () => {
  const result = validateTossSaveDraft(
    { clientKey: 'test_ck_fixture', secretKey: '', variantKey: '' },
    false
  );
  assert.deepEqual(result, { ok: true });
});

test('mapTossProviderError maps encryption error code', () => {
  const message = mapTossProviderError(new Error('ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED'));
  assert.match(message, /ADMIN_SETTINGS_ENCRYPTION_KEY/);
});
