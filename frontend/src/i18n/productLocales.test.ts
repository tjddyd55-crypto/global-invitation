import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PRODUCT_LOCALE,
  languageFromLocale,
  localeFromLanguage,
  resolveInvitationLocale,
  resolveInvitationProductLocale,
  resolveServiceLocale,
} from './productLocales';

test('product locales are ko-KR and en-US', () => {
  assert.equal(languageFromLocale('ko-KR'), 'ko');
  assert.equal(languageFromLocale('en-US'), 'en');
  assert.equal(localeFromLanguage('ko'), 'ko-KR');
  assert.equal(localeFromLanguage('en'), 'en-US');
  assert.equal(localeFromLanguage('mn'), 'ko-KR');
});

test('invitation locale missing/legacy falls back to ko-KR', () => {
  assert.equal(resolveInvitationLocale(undefined), 'ko-KR');
  assert.equal(resolveInvitationLocale(''), 'ko-KR');
  assert.equal(resolveInvitationLocale('mn'), 'ko-KR');
  assert.equal(resolveInvitationLocale('kr'), 'ko-KR');
  assert.equal(resolveInvitationLocale('ja-JP'), 'ko-KR');
  assert.equal(resolveInvitationLocale('en'), 'en-US');
  assert.equal(resolveInvitationLocale('en-US'), 'en-US');
});

test('Invitation.language is canonical over dataJson.locale', () => {
  assert.equal(
    resolveInvitationProductLocale({ language: 'ko-KR', dataJson: { locale: 'en-US' } }),
    'ko-KR'
  );
  assert.equal(
    resolveInvitationProductLocale({ language: 'en', dataJson: { locale: 'ko-KR' } }),
    'en-US'
  );
  assert.equal(resolveInvitationProductLocale({ language: null, dataJson: { locale: 'en-US' } }), 'en-US');
  assert.equal(resolveInvitationProductLocale({ language: '', dataJson: {} }), 'ko-KR');
});

test('service locale priority: stored > cookie > legacy language > browser > default', () => {
  assert.equal(
    resolveServiceLocale({
      storedLocale: 'en-US',
      cookieLocale: 'ko-KR',
      storedLanguage: 'ko',
      browserLanguage: 'ko-KR',
    }),
    'en-US'
  );
  assert.equal(
    resolveServiceLocale({
      storedLocale: null,
      cookieLocale: 'en-US',
      storedLanguage: 'ko',
      browserLanguage: 'ko-KR',
    }),
    'en-US'
  );
  assert.equal(
    resolveServiceLocale({
      storedLocale: null,
      cookieLocale: null,
      storedLanguage: 'en',
      browserLanguage: 'ko-KR',
    }),
    'en-US'
  );
  assert.equal(
    resolveServiceLocale({
      storedLocale: null,
      cookieLocale: null,
      storedLanguage: null,
      cookieLanguage: null,
      browserLanguage: 'en-US',
    }),
    'en-US'
  );
  assert.equal(
    resolveServiceLocale({
      storedLocale: null,
      cookieLocale: null,
      storedLanguage: null,
      cookieLanguage: null,
      browserLanguage: 'fr-FR',
    }),
    DEFAULT_PRODUCT_LOCALE
  );
});
