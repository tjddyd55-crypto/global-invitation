import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_INVITATION_LOCALE,
  isSupportedInvitationLocale,
  normalizeInvitationLocale,
  withInvitationLocaleSnapshot,
} from './invitationLocale';

test('supported invitation locales are ko-KR and en-US only', () => {
  assert.equal(isSupportedInvitationLocale('ko-KR'), true);
  assert.equal(isSupportedInvitationLocale('en-US'), true);
  assert.equal(isSupportedInvitationLocale('ja-JP'), false);
  assert.equal(isSupportedInvitationLocale('mn'), false);
});

test('normalizeInvitationLocale maps legacy codes and missing to ko-KR', () => {
  assert.equal(normalizeInvitationLocale('ko-KR'), 'ko-KR');
  assert.equal(normalizeInvitationLocale('en-US'), 'en-US');
  assert.equal(normalizeInvitationLocale('ko'), 'ko-KR');
  assert.equal(normalizeInvitationLocale('en'), 'en-US');
  assert.equal(normalizeInvitationLocale('mn'), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale(''), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale(null), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale('fr-FR'), DEFAULT_INVITATION_LOCALE);
});

test('create snapshot writes locale into dataJson without dropping user fields', () => {
  const snapshot = withInvitationLocaleSnapshot(
    { title: '서울광진청년회의소', conceptType: 'ORGANIZATION' },
    'en-US'
  );
  assert.equal(snapshot.locale, 'en-US');
  assert.equal(snapshot.language, 'en-US');
  assert.equal(snapshot.title, '서울광진청년회의소');
});
