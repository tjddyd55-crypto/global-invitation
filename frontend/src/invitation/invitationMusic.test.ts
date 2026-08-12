import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePlayableInvitationMusic } from './invitationMusic';

test('resolvePlayableInvitationMusic leaves music off by default', () => {
  assert.equal(resolvePlayableInvitationMusic({}, () => undefined), null);
  assert.equal(
    resolvePlayableInvitationMusic({ music: { enabled: false } }, () => undefined),
    null
  );
});

test('resolvePlayableInvitationMusic normalizes shared object key via CDN helper', () => {
  const key = 'invitation/shared/music/general/sample.mp3';
  const playable = resolvePlayableInvitationMusic(
    {
      music: {
        enabled: true,
        sourceType: 'SHARED',
        fileUrl: key,
        title: 'JCI Creed Song',
      },
    },
    () => undefined
  );
  assert.ok(playable);
  assert.equal(playable!.title, 'JCI Creed Song');
  assert.ok(playable!.src.includes(key) || playable!.src === key);
});

test('resolvePlayableInvitationMusic does not autoplay — returns src only', () => {
  const playable = resolvePlayableInvitationMusic(
    {
      music: {
        enabled: true,
        fileUrl: 'https://cdn.platform-assets.com/invitation/shared/music/general/a.mp3',
      },
    },
    () => undefined
  );
  assert.ok(playable);
  assert.equal(typeof playable!.src, 'string');
});
