/**
 * Persisted invitation → KakaoTalk share content (save-before-share).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildKakaoTalkShareContentFromPersistedInvitation } from './shareKakaoTalkFromPersisted';

test('buildKakaoTalkShareContentFromPersistedInvitation uses OG + /i/{shareSlug}', () => {
  const content = buildKakaoTalkShareContentFromPersistedInvitation(
    {
      title: 'DB Title',
      shareSlug: 'fresh-slug-99',
      dataJson: {
        openGraph: {
          title: '[KAKAO-TEST-01] OG Title',
          description: 'OG Description',
          imageUrl: 'https://cdn.platform-assets.com/invitation/development/users/u/invitations/i/og/a.jpg',
        },
      },
    },
    'https://frontend-development-1b8a.up.railway.app'
  );

  assert.equal(content.title, '[KAKAO-TEST-01] OG Title');
  assert.equal(content.description, 'OG Description');
  assert.equal(
    content.imageUrl,
    'https://cdn.platform-assets.com/invitation/development/users/u/invitations/i/og/a.jpg'
  );
  assert.equal(
    content.canonicalUrl,
    'https://frontend-development-1b8a.up.railway.app/i/fresh-slug-99'
  );
});

test('buildKakaoTalkShareContentFromPersistedInvitation requires shareSlug', () => {
  assert.throws(
    () =>
      buildKakaoTalkShareContentFromPersistedInvitation(
        { title: 'x', dataJson: {} },
        'https://frontend-development-1b8a.up.railway.app'
      ),
    /MISSING_SHARE_SLUG/
  );
});
