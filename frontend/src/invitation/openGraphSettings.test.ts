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
});

test('hero image fallback when OG image missing', () => {
  const settings = getInvitationOpenGraphSettings(
    {
      dataJson: {
        conceptType: 'WEDDING',
        heroImage: 'https://cdn.example.com/hero.jpg',
        share: { ogTitle: 'T', ogDescription: 'D' },
      },
    },
    'https://frontend.example/i/x'
  );
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

test('save fields sync openGraph and legacy share', () => {
  const fields = buildOpenGraphSaveFields({
    title: '  Hello  ',
    description: ' World ',
    imageUrl: 'https://cdn.example.com/og.jpg',
  });
  assert.equal(fields.openGraph.title, 'Hello');
  assert.equal(fields.share.ogTitle, 'Hello');
  assert.equal(fields.share.ogImage, 'https://cdn.example.com/og.jpg');
});
