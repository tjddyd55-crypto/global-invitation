/**
 * Unit tests for temporary invitation media retention / protection / classification helpers.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TEMP_MEDIA_RETENTION_HOURS,
  isEligibleTempInvitationUserAssetKey,
  isProtectedInvitationSharedAsset,
  isTempMediaCleanupEnabled,
  normalizeMediaReferenceToken,
  resolveTempMediaCleanupBatchSize,
  resolveTempMediaRetentionHours,
  resolveTempMediaSafetyThreshold,
  retentionCutoffDate,
} from './index';
import { isActivelyReferenced, type InvitationReferenceIndex } from './scanInvitationReferences';

test('retention invalid → 72 fallback', () => {
  assert.equal(resolveTempMediaRetentionHours(undefined), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours(''), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours(0), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours(-1), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours(12), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours(23), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
  assert.equal(resolveTempMediaRetentionHours('nope'), DEFAULT_TEMP_MEDIA_RETENTION_HOURS);
});

test('retention clamps to max 720', () => {
  assert.equal(resolveTempMediaRetentionHours(9000), 720);
  assert.equal(resolveTempMediaRetentionHours(721), 720);
  assert.equal(resolveTempMediaRetentionHours(720), 720);
  assert.equal(resolveTempMediaRetentionHours(48), 48);
  assert.equal(resolveTempMediaRetentionHours(24), 24);
  assert.equal(resolveTempMediaRetentionHours(72), 72);
});

test('batch size defaults and clamps', () => {
  assert.equal(resolveTempMediaCleanupBatchSize(undefined), 100);
  assert.equal(resolveTempMediaCleanupBatchSize(0), 100);
  assert.equal(resolveTempMediaCleanupBatchSize(1), 1);
  assert.equal(resolveTempMediaCleanupBatchSize(50), 50);
  assert.equal(resolveTempMediaCleanupBatchSize(100), 100);
  assert.equal(resolveTempMediaCleanupBatchSize(9999), 500);
});

test('safety threshold default', () => {
  assert.equal(resolveTempMediaSafetyThreshold(undefined), 1000);
  assert.equal(resolveTempMediaSafetyThreshold(0), 1000);
  assert.equal(resolveTempMediaSafetyThreshold(-5), 1000);
  assert.equal(resolveTempMediaSafetyThreshold(250), 250);
});

test('cleanup enabled defaults false', () => {
  assert.equal(isTempMediaCleanupEnabled(undefined), false);
  assert.equal(isTempMediaCleanupEnabled('false'), false);
  assert.equal(isTempMediaCleanupEnabled('true'), true);
});

test('cutoff uses retention hours', () => {
  const now = new Date('2026-08-06T12:00:00.000Z');
  const cutoff = retentionCutoffDate(now, 72);
  assert.equal(cutoff.toISOString(), '2026-08-03T12:00:00.000Z');
});

test('shared assets protected', () => {
  assert.equal(
    isProtectedInvitationSharedAsset('invitation/shared/images/templates/WEDDING_04_EDITORIAL/hero.webp'),
    true
  );
  assert.equal(isProtectedInvitationSharedAsset('invitation/shared/music/wedding/track.mp3'), true);
});

test('canonical user asset eligible', () => {
  const key =
    'invitation/development/users/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/invitations/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/gallery/file.webp';
  assert.equal(isEligibleTempInvitationUserAssetKey(key), true);
  assert.equal(isProtectedInvitationSharedAsset(key), false);
});

test('non-canonical and foreign prefixes excluded', () => {
  assert.equal(isEligibleTempInvitationUserAssetKey('development/invitation/users/x/invitations/y/gallery/a.webp'), false);
  assert.equal(isEligibleTempInvitationUserAssetKey('other-project/users/x/file.webp'), false);
  assert.equal(isEligibleTempInvitationUserAssetKey('invitation/development/temp/user/upload/a.webp'), false);
});

test('shared general music keys are protected from cleanup/delete', () => {
  assert.equal(
    isProtectedInvitationSharedAsset(
      'invitation/shared/music/general/7915ed06-84da-4a1d-aee9-3bae103fccf7.mp3'
    ),
    true
  );
  assert.equal(
    isProtectedInvitationSharedAsset(
      'invitation/shared/music/general/8f92cd5b-c174-4386-aa8d-f507e667ba71.mp3'
    ),
    true
  );
});

test('shared asset assert blocks delete without scan', async () => {
  const { assertInvitationUserMediaSafeToDelete } = await import('./assertSafeToDelete');
  await assert.rejects(
    () =>
      assertInvitationUserMediaSafeToDelete(
        'invitation/shared/images/templates/WEDDING_04_EDITORIAL/hero.webp'
      ),
    /PROTECTED_SHARED_MEDIA/
  );
});

test('CDN URL and query string normalize to object key', () => {
  assert.equal(
    normalizeMediaReferenceToken(
      'https://cdn.platform-assets.com/invitation/development/users/u/invitations/i/gallery/a.webp?x=1'
    ),
    'invitation/development/users/u/invitations/i/gallery/a.webp'
  );
  assert.equal(
    normalizeMediaReferenceToken('invitation/development/users/u/invitations/i/hero/b.webp'),
    'invitation/development/users/u/invitations/i/hero/b.webp'
  );
});

test('active reference fail-closed when scan failed', () => {
  const failed: InvitationReferenceIndex = {
    status: 'failed',
    activeKeys: new Set(),
    deletedKeys: new Set(),
    invitationCount: 0,
  };
  assert.equal(isActivelyReferenced('invitation/development/users/u/invitations/i/gallery/a.webp', failed), true);
});

test('active reference match', () => {
  const key = 'invitation/development/users/u/invitations/i/gallery/a.webp';
  const index: InvitationReferenceIndex = {
    status: 'ok',
    activeKeys: new Set([key]),
    deletedKeys: new Set(),
    invitationCount: 1,
  };
  assert.equal(isActivelyReferenced(key, index), true);
  assert.equal(isActivelyReferenced('invitation/development/users/u/invitations/i/gallery/other.webp', index), false);
});
