/**
 * Unit checks for KakaoTalk share payload builder (KakaoStory 금지).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildKakaoTalkSharePayload,
  isValidKakaoTalkCanonicalUrl,
  shareViaKakaoTalk,
  type KakaoShareMode,
} from './shareKakaoTalk';

const CDN = 'https://cdn.platform-assets.com/invitation/development/users/u/invitations/i/og/a.jpg';
const CANONICAL = 'https://frontend-development-1b8a.up.railway.app/i/share-slug-01';

test('buildKakaoTalkSharePayload reflects custom OG title/description/image and /i/ canonical', () => {
  const payload = buildKakaoTalkSharePayload({
    title: '[KAKAO-TEST-01] 유동규 ♥ 이소영',
    description: '소중한 날에 함께해 주세요',
    imageUrl: CDN,
    canonicalUrl: CANONICAL,
  });

  assert.equal(payload.objectType, 'feed');
  assert.equal(payload.content.title, '[KAKAO-TEST-01] 유동규 ♥ 이소영');
  assert.equal(payload.content.description, '소중한 날에 함께해 주세요');
  assert.equal(payload.content.imageUrl, CDN);
  assert.equal(payload.content.link.webUrl, CANONICAL);
  assert.equal(payload.content.link.mobileWebUrl, CANONICAL);
  assert.ok(payload.content.link.webUrl.includes('/i/'));
  assert.ok(payload.content.link.mobileWebUrl.includes('/i/'));
  assert.equal(payload.buttons[0]?.title, '초대장 보기');
  assert.equal(payload.buttons[0]?.link.webUrl, CANONICAL);
});

test('isValidKakaoTalkCanonicalUrl accepts /i/{slug} only', () => {
  assert.equal(isValidKakaoTalkCanonicalUrl(CANONICAL), true);
  assert.equal(isValidKakaoTalkCanonicalUrl('https://frontend-development-1b8a.up.railway.app/'), false);
  assert.equal(isValidKakaoTalkCanonicalUrl('https://frontend-development-1b8a.up.railway.app'), false);
  assert.equal(
    isValidKakaoTalkCanonicalUrl('https://frontend-development-1b8a.up.railway.app/editor/abc'),
    false
  );
  assert.equal(
    isValidKakaoTalkCanonicalUrl('https://frontend-development-1b8a.up.railway.app/invitation/abc'),
    false
  );
});

test('buildKakaoTalkSharePayload rejects root and editor URLs', () => {
  assert.throws(
    () =>
      buildKakaoTalkSharePayload({
        title: 't',
        description: 'd',
        canonicalUrl: 'https://frontend-development-1b8a.up.railway.app/',
      }),
    /INVALID_KAKAO_SHARE_CANONICAL_URL/
  );
  assert.throws(
    () =>
      buildKakaoTalkSharePayload({
        title: 't',
        description: 'd',
        canonicalUrl: 'https://frontend-development-1b8a.up.railway.app/editor/x',
      }),
    /INVALID_KAKAO_SHARE_CANONICAL_URL/
  );
});

test('shareViaKakaoTalk calls sendDefault once when SDK ready', async () => {
  const calls: unknown[] = [];
  const previous = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = {
    Kakao: {
      isInitialized: () => true,
      init: () => undefined,
      Share: {
        sendDefault: (payload: unknown) => {
          calls.push(payload);
        },
      },
    },
  };

  const prevKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = 'test-key-not-a-secret-for-unit';

  try {
    const mode: KakaoShareMode = await shareViaKakaoTalk({
      title: 'Custom Title',
      description: 'Custom Description',
      imageUrl: CDN,
      canonicalUrl: CANONICAL,
    });
    assert.equal(mode, 'kakao-sdk');
    assert.equal(calls.length, 1);
    const payload = calls[0] as {
      content: { title: string; description: string; imageUrl?: string; link: { webUrl: string } };
    };
    assert.equal(payload.content.title, 'Custom Title');
    assert.equal(payload.content.description, 'Custom Description');
    assert.equal(payload.content.imageUrl, CDN);
    assert.ok(payload.content.link.webUrl.includes('/i/'));
  } finally {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = prevKey;
    if (previous === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = previous;
    }
  }
});

test('shareViaKakaoTalk falls back to native-share then clipboard', async () => {
  const previous = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = {};

  const prevKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = '';

  const shareCalls: unknown[] = [];
  const clipboardWrites: string[] = [];

  const nav = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      share: async (data: unknown) => {
        shareCalls.push(data);
      },
      clipboard: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
        },
      },
    },
  });

  try {
    const mode = await shareViaKakaoTalk({
      title: 't',
      description: 'd',
      canonicalUrl: CANONICAL,
    });
    assert.equal(mode, 'native-share');
    assert.equal(shareCalls.length, 1);
    assert.equal(clipboardWrites.length, 0);
  } finally {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = prevKey;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: nav });
    if (previous === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = previous;
    }
  }
});

test('shareViaKakaoTalk clipboard fallback when native share unavailable', async () => {
  const previous = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = {};

  const prevKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = '';

  const clipboardWrites: string[] = [];
  const nav = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
        },
      },
    },
  });

  try {
    const mode = await shareViaKakaoTalk({
      title: 't',
      description: 'd',
      canonicalUrl: CANONICAL,
    });
    assert.equal(mode, 'clipboard');
    assert.deepEqual(clipboardWrites, [CANONICAL]);
  } finally {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = prevKey;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: nav });
    if (previous === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = previous;
    }
  }
});
