import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertKeyNotProtectedSsot,
  canDeleteFromManifestItem,
  classifyLegacyInvitationObject,
  isProtectedSsotKey,
} from './legacyInvitationClassification';

test('invitation/ keys are always PROTECTED_SSOT', () => {
  for (const key of [
    'invitation/development/users/u/invitations/i/hero/a.jpg',
    'invitation/production/users/u/invitations/i/gallery/a.jpg',
    'invitation/shared/music/common/uuid.mp3',
    'invitation/shared/music/wedding/uuid.mp3',
  ]) {
    assert.equal(isProtectedSsotKey(key), true);
    const result = classifyLegacyInvitationObject({
      key,
      dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
    });
    assert.equal(result.classification, 'PROTECTED_SSOT');
    assert.equal(result.deleteCandidate, false);
  }
});

test('other project prefixes are protected', () => {
  const result = classifyLegacyInvitationObject({
    key: 'insurance/claims/file.pdf',
    dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
  });
  assert.equal(result.classification, 'PROTECTED_OTHER_PROJECT');
});

test('DB referenced keys are protected', () => {
  const result = classifyLegacyInvitationObject({
    key: 'invitations/old/hero.jpg',
    dbReferenceStatus: 'DB_ACTIVE_REFERENCE',
    dbReferenceCount: 1,
  });
  assert.equal(result.classification, 'PROTECTED_DB_REFERENCE');
});

test('UNKNOWN is never a delete candidate', () => {
  const result = classifyLegacyInvitationObject({
    key: 'random-prefix/file.bin',
    dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
  });
  assert.equal(result.classification, 'UNKNOWN');
  assert.equal(result.deleteCandidate, false);
});

test('legacy invitation candidates are not auto SAFE_TO_DELETE without allowlist', () => {
  const result = classifyLegacyInvitationObject({
    key: 'invitations/legacy/gallery/a.jpg',
    dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
  });
  assert.equal(result.classification, 'PROTECTED_CODE_REFERENCE');
  assert.equal(result.deleteCandidate, false);
});

test('SAFE_TO_DELETE only when allowlisted and DB-clear', () => {
  const result = classifyLegacyInvitationObject({
    key: 'invitations/legacy/gallery/a.jpg',
    dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
    safeDeleteAllowlist: ['invitations/'],
  });
  assert.equal(result.classification, 'SAFE_TO_DELETE');
  assert.equal(result.deleteCandidate, true);
});

test('approved=false cannot delete', () => {
  const denied = canDeleteFromManifestItem({
    key: 'invitations/x.jpg',
    classification: 'SAFE_TO_DELETE',
    approved: false,
    reviewed: true,
  });
  assert.equal(denied.ok, false);
});

test('assert rejects invitation SSOT keys', () => {
  assert.throws(() => assertKeyNotProtectedSsot('invitation/shared/music/common/a.mp3'));
});

test('REFERENCE_CHECK_FAILED blocks delete classification', () => {
  const result = classifyLegacyInvitationObject({
    key: 'invitations/x.jpg',
    dbReferenceStatus: 'REFERENCE_CHECK_FAILED',
  });
  assert.equal(result.classification, 'PROTECTED_DB_REFERENCE');
});

test('env-peeled legacy invitation is a candidate when not code-prefix users/', () => {
  const result = classifyLegacyInvitationObject({
    key: 'development/invitation/users/u/invitations/i/hero/a.jpg',
    dbReferenceStatus: 'DB_REFERENCE_NOT_FOUND',
  });
  assert.equal(result.classification, 'LEGACY_INVITATION_CANDIDATE');
});
