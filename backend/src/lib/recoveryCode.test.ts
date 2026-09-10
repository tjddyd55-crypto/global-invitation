import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateRecoveryCode,
  hashRecoveryCode,
  normalizeRecoveryCodeInput,
  verifyRecoveryCode,
} from './recoveryCode';

test('generateRecoveryCode produces formatted segments', () => {
  const code = generateRecoveryCode();
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
});

test('verifyRecoveryCode matches hashed value', () => {
  const code = 'ABCD-EFGH-JKLM-NPQR';
  const hash = hashRecoveryCode(code);
  assert.equal(verifyRecoveryCode(code, hash), true);
  assert.equal(verifyRecoveryCode('ABCD-EFGH-JKLM-NPQS', hash), false);
});

test('normalizeRecoveryCodeInput uppercases input', () => {
  assert.equal(normalizeRecoveryCodeInput(' abcd-efgh '), 'ABCD-EFGH');
});
