import assert from 'node:assert/strict';
import test from 'node:test';
import { filterInvitationCleanupR2Keys } from './filterInvitationCleanupR2Keys';

test('shared JCI logo and music are excluded from invitation cleanup', () => {
  const keys = [
    'invitation/development/users/u1/invitations/i1/hero/a.webp',
    'invitation/shared/images/templates/ORGANIZATION_02_JCI/logo.webp',
    'invitation/shared/music/general/7915ed06-84da-4a1d-aee9-3bae103fccf7.mp3',
    'invitation/shared/images/templates/WEDDING_05_GARDEN/hero.webp',
  ];
  assert.deepEqual(filterInvitationCleanupR2Keys(keys), [
    'invitation/development/users/u1/invitations/i1/hero/a.webp',
  ]);
});
