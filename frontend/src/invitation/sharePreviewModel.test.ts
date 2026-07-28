/**
 * Unit checks for share card preview model (openGraphSettings SSOT).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildInvitationSharePreviewModel,
  formatShareCardDisplayUrl,
} from './sharePreviewModel';
import { buildKakaoTalkSharePayload } from '../lib/shareKakaoTalk';

const SITE = 'https://frontend-development-1b8a.up.railway.app';
const CDN = 'https://cdn.platform-assets.com/invitation/development/users/u/invitations/i/og/a.jpg';

test('buildInvitationSharePreviewModel uses OG fields and /i/{shareSlug}', () => {
  const model = buildInvitationSharePreviewModel({
    siteOrigin: SITE,
    shareSlug: 'px3vzcyg',
    invitationLike: {
      title: 'DB Title',
      shareSlug: 'px3vzcyg',
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.platform-assets.com/invitation/shared/hero.jpg',
        openGraph: {
          title: '유동규 💚 이소영 결혼합니다[ddd]',
          description: '2025년 4월 13일 오후 5:20 · 더링크호텔 서울 3층 베일리홀',
          imageUrl: CDN,
        },
      },
    },
  });

  assert.equal(model.title, '유동규 💚 이소영 결혼합니다[ddd]');
  assert.equal(model.description, '2025년 4월 13일 오후 5:20 · 더링크호텔 서울 3층 베일리홀');
  assert.equal(model.imageUrl, CDN);
  assert.equal(model.canonicalUrl, `${SITE}/i/px3vzcyg`);
  assert.equal(model.displayUrl, 'frontend-development-1b8a.up.railway.app/i/px3vzcyg');
  assert.equal(model.hasPublicUrl, true);
  assert.ok(!model.canonicalUrl.endsWith('.up.railway.app/'));
  assert.ok(!model.displayUrl.includes('/editor/'));
});

test('unpublished invitation does not show root URL', () => {
  const model = buildInvitationSharePreviewModel({
    siteOrigin: SITE,
    shareSlug: null,
    invitationLike: {
      title: 'Draft',
      dataJson: {
        openGraph: { title: 'Draft Title', description: 'Draft Desc' },
      },
    },
  });

  assert.equal(model.hasPublicUrl, false);
  assert.equal(model.canonicalUrl, '');
  assert.equal(model.displayUrl, '');
  assert.equal(model.title, 'Draft Title');
});

test('hero image fallback when OG image missing', () => {
  const hero = 'https://cdn.platform-assets.com/invitation/shared/hero.jpg';
  const model = buildInvitationSharePreviewModel({
    siteOrigin: SITE,
    shareSlug: 'abc',
    invitationLike: {
      dataJson: {
        heroImage: hero,
        openGraph: { title: 'T', description: 'D' },
        share: { ogTitle: 'T', ogDescription: 'D', ogImage: '' },
      },
    },
  });
  assert.equal(model.imageUrl, hero);
});

test('preview model matches KakaoTalk payload fields', () => {
  const model = buildInvitationSharePreviewModel({
    siteOrigin: SITE,
    shareSlug: 'share-01',
    invitationLike: {
      dataJson: {
        openGraph: {
          title: 'Kakao Title',
          description: 'Kakao Desc',
          imageUrl: CDN,
        },
      },
    },
  });
  const payload = buildKakaoTalkSharePayload({
    title: model.title,
    description: model.description,
    imageUrl: model.imageUrl,
    canonicalUrl: model.canonicalUrl,
  });
  assert.equal(payload.content.title, model.title);
  assert.equal(payload.content.description, model.description);
  assert.equal(payload.content.imageUrl, model.imageUrl);
  assert.equal(payload.content.link.webUrl, model.canonicalUrl);
});

test('formatShareCardDisplayUrl strips protocol', () => {
  assert.equal(
    formatShareCardDisplayUrl(`${SITE}/i/px3vzcyg`),
    'frontend-development-1b8a.up.railway.app/i/px3vzcyg'
  );
});
