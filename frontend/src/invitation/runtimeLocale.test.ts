import assert from 'node:assert/strict';
import test from 'node:test';
import { copyRuntimeInvitationLocale } from './runtimeLocale';

test('copyRuntimeInvitationLocale preserves language over empty target', () => {
  const next = copyRuntimeInvitationLocale(
    { title: 'Test', conceptType: 'WEDDING' } as Record<string, unknown>,
    { language: 'en-US', locale: 'en-US', title: '[E2E]' }
  );
  assert.equal(next.language, 'en-US');
  assert.equal(next.locale, 'en-US');
  assert.equal(next.title, 'Test');
});

test('copyRuntimeInvitationLocale ignores blank locale fields', () => {
  const next = copyRuntimeInvitationLocale({ title: 'A' }, { language: '  ', locale: '' });
  assert.equal('language' in next, false);
  assert.equal('locale' in next, false);
});
