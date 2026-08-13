import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_INVITATION_LOCALE,
  isSupportedInvitationLocale,
  normalizeInvitationLocale,
  parseCreateInvitationLocale,
  resolveStoredInvitationLocale,
  stripLegacyDataJsonLocale,
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
  assert.equal(normalizeInvitationLocale('kr'), 'ko-KR');
  assert.equal(normalizeInvitationLocale('en'), 'en-US');
  assert.equal(normalizeInvitationLocale('mn'), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale(''), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale(null), DEFAULT_INVITATION_LOCALE);
  assert.equal(normalizeInvitationLocale('fr-FR'), DEFAULT_INVITATION_LOCALE);
});

test('parseCreateInvitationLocale rejects arbitrary strings', () => {
  assert.deepEqual(parseCreateInvitationLocale('ko-KR'), { ok: true, locale: 'ko-KR', omitted: false });
  assert.deepEqual(parseCreateInvitationLocale('en-US'), { ok: true, locale: 'en-US', omitted: false });
  assert.deepEqual(parseCreateInvitationLocale('en'), { ok: true, locale: 'en-US', omitted: false });
  assert.deepEqual(parseCreateInvitationLocale(''), { ok: true, locale: 'ko-KR', omitted: true });
  assert.deepEqual(parseCreateInvitationLocale(undefined), { ok: true, locale: 'ko-KR', omitted: true });
  assert.deepEqual(parseCreateInvitationLocale('mn'), { ok: false, error: 'INVALID_LOCALE' });
  assert.deepEqual(parseCreateInvitationLocale('fr-FR'), { ok: false, error: 'INVALID_LOCALE' });
  assert.deepEqual(parseCreateInvitationLocale('english'), { ok: false, error: 'INVALID_LOCALE' });
});

test('Invitation.language wins over conflicting dataJson.locale', () => {
  assert.equal(
    resolveStoredInvitationLocale({
      language: 'ko-KR',
      dataJson: { locale: 'en-US', title: '서울광진청년회의소' },
    }),
    'ko-KR'
  );
  assert.equal(
    resolveStoredInvitationLocale({
      language: null,
      dataJson: { locale: 'en-US' },
    }),
    'en-US'
  );
  assert.equal(
    resolveStoredInvitationLocale({
      language: '',
      dataJson: {},
    }),
    'ko-KR'
  );
});

test('stripLegacyDataJsonLocale removes snapshot fields and keeps user content', () => {
  const stripped = stripLegacyDataJsonLocale({
    title: '서울광진청년회의소',
    locale: 'en-US',
    language: 'en-US',
    conceptType: 'ORGANIZATION',
  });
  assert.equal(stripped.title, '서울광진청년회의소');
  assert.equal(stripped.conceptType, 'ORGANIZATION');
  assert.equal('locale' in stripped, false);
  assert.equal('language' in stripped, false);
});
