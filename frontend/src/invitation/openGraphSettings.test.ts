/**
 * Unit checks for invitation Open Graph SSOT.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOpenGraphSaveFields,
  getInvitationOpenGraphSettings,
  isValidOpenGraphImageUrl,
  sanitizeOpenGraphDescription,
  sanitizeOpenGraphTitle,
} from './openGraphSettings';

test('prefers openGraph and share.og* over invitation title', () => {
  const settings = getInvitationOpenGraphSettings(
    {
      title: 'DB Title',
      dataJson: {
        conceptType: 'WEDDING',
        openGraph: {
          title: 'OG Title',
          description: 'OG Description',
          imageMode: 'CUSTOM',
          imageUrl: 'https://cdn.example.com/invitation/development/users/u/invitations/i/og/a.jpg',
        },
      },
      shareSlug: 'abc',
    },
    'https://frontend.example/i/abc',
    { siteOrigin: 'https://frontend.example' }
  );
  assert.equal(settings.title, 'OG Title');
  assert.equal(settings.description, 'OG Description');
  assert.equal(
    settings.imageUrl,
    'https://cdn.example.com/invitation/development/users/u/invitations/i/og/a.jpg'
  );
  assert.equal(settings.imageMode, 'CUSTOM');
  assert.equal(settings.canonicalUrl, 'https://frontend.example/i/abc');
});

test('legacy share.ogTitle is compatible', () => {
  const settings = getInvitationOpenGraphSettings(
    {
      title: 'Fallback',
      dataJson: {
        conceptType: 'WEDDING',
        share: {
          ogTitle: 'Legacy Title',
          ogDescription: 'Legacy Description',
          ogImage: 'https://cdn.example.com/hero.jpg',
        },
      },
    },
    'https://frontend.example/i/x'
  );
  assert.equal(settings.title, 'Legacy Title');
  assert.equal(settings.description, 'Legacy Description');
  assert.equal(settings.imageUrl, 'https://cdn.example.com/hero.jpg');
  assert.equal(settings.imageMode, 'CUSTOM');
});

test('legacy missing OG image falls back to hero for public-meta only', () => {
  const publicSettings = getInvitationOpenGraphSettings(
    {
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.example.com/hero.jpg',
        share: { ogTitle: 'T', ogDescription: 'D' },
      },
    },
    'https://frontend.example/i/x',
    { purpose: 'public-meta' }
  );
  assert.equal(publicSettings.imageUrl, 'https://cdn.example.com/hero.jpg');
  assert.equal(publicSettings.imageMode, 'LEGACY');

  const editorSettings = getInvitationOpenGraphSettings(
    {
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.example.com/hero.jpg',
        share: { ogTitle: 'T', ogDescription: 'D' },
      },
    },
    'https://frontend.example/i/x',
    { purpose: 'editor-preview' }
  );
  assert.equal(editorSettings.imageUrl, undefined);
});

test('NONE mode never falls back to hero in editor preview', () => {
  const settings = getInvitationOpenGraphSettings(
    {
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.example.com/hero.jpg',
        openGraph: {
          title: 'T',
          description: 'D',
          imageMode: 'NONE',
          imageUrl: '',
          imageRemoved: true,
        },
        share: {
          ogTitle: 'T',
          ogDescription: 'D',
          ogImage: '',
          ogImageMode: 'NONE',
          ogImageRemoved: true,
        },
      },
    },
    'https://frontend.example/i/x',
    { purpose: 'editor-preview' }
  );
  assert.equal(settings.imageMode, 'NONE');
  assert.equal(settings.imageUrl, undefined);
});

test('NONE mode uses concept CDN for public-meta and share-payload', () => {
  const input = {
    dataJson: {
      conceptType: 'WEDDING',
      heroImage: 'https://cdn.example.com/hero.jpg',
      openGraph: {
        title: 'T',
        description: 'D',
        imageMode: 'NONE',
        imageUrl: '',
        imageRemoved: true,
      },
      share: {
        ogTitle: 'T',
        ogDescription: 'D',
        ogImage: '',
        ogImageMode: 'NONE',
        ogImageRemoved: true,
      },
    },
  };
  const publicSettings = getInvitationOpenGraphSettings(input, 'https://frontend.example/i/x', {
    purpose: 'public-meta',
  });
  const payloadSettings = getInvitationOpenGraphSettings(input, 'https://frontend.example/i/x', {
    purpose: 'share-payload',
  });
  assert.equal(publicSettings.imageMode, 'NONE');
  assert.equal(payloadSettings.imageMode, 'NONE');
  assert.equal(
    publicSettings.imageUrl,
    'https://cdn.platform-assets.com/invitation/shared/images/wedding/placeholder-og.jpg'
  );
  assert.equal(publicSettings.imageUrl, payloadSettings.imageUrl);
});

test('HERO mode uses hero only when explicitly set', () => {
  const settings = getInvitationOpenGraphSettings(
    {
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.example.com/hero.jpg',
        openGraph: { title: 'T', description: 'D', imageMode: 'HERO', imageUrl: '' },
        share: { ogTitle: 'T', ogDescription: 'D', ogImage: '', ogImageMode: 'HERO' },
      },
    },
    'https://frontend.example/i/x',
    { purpose: 'editor-preview' }
  );
  assert.equal(settings.imageMode, 'HERO');
  assert.equal(settings.imageUrl, 'https://cdn.example.com/hero.jpg');
});

test('rejects blob and signed URLs', () => {
  assert.equal(isValidOpenGraphImageUrl('blob:https://x'), false);
  assert.equal(isValidOpenGraphImageUrl('https://cdn.example.com/a.jpg?X-Amz-Signature=abc'), false);
  assert.equal(isValidOpenGraphImageUrl('https://cdn.example.com/a.jpg'), true);
});

test('sanitize clamps title/description', () => {
  assert.ok(sanitizeOpenGraphTitle('a'.repeat(100)).length <= 80);
  assert.ok(sanitizeOpenGraphDescription('b'.repeat(300)).length <= 160);
});

test('save fields sync openGraph and legacy share with NONE', () => {
  const fields = buildOpenGraphSaveFields({
    title: '  Hello  ',
    description: ' World ',
    imageUrl: 'https://cdn.example.com/og.jpg',
    imageMode: 'CUSTOM',
  });
  assert.equal(fields.openGraph.title, 'Hello');
  assert.equal(fields.share.ogTitle, 'Hello');
  assert.equal(fields.share.ogImage, 'https://cdn.example.com/og.jpg');
  assert.equal(fields.openGraph.imageMode, 'CUSTOM');

  const cleared = buildOpenGraphSaveFields({
    title: 'Hello',
    description: 'World',
    imageUrl: 'https://cdn.example.com/og.jpg',
    imageMode: 'NONE',
  });
  assert.equal(cleared.openGraph.imageUrl, '');
  assert.equal(cleared.share.ogImage, '');
  assert.equal(cleared.openGraph.imageRemoved, true);
  assert.equal(cleared.openGraph.imageMode, 'NONE');
});
