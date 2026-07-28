/**
 * KakaoTalk share — KakaoStory 금지. SDK singleton + feed payload.
 * objectType feed + content/buttons만 사용. 스토리 공유 URL 경로 없음.
 */
'use client';

const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
const KAKAO_SDK_INTEGRITY =
  'sha384-TKGoSoHzzmMKFNKmK69z8rWTNpv/6Fv1vgGp8LY2uk6NJmKTigMF9LmR4Ol1TB+9';

export type KakaoShareMode = 'kakao-sdk' | 'native-share' | 'clipboard';

export type KakaoTalkSharePayloadInput = {
  title: string;
  description: string;
  imageUrl?: string;
  canonicalUrl: string;
  buttonTitle?: string;
};

export type KakaoTalkFeedPayload = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

type KakaoSDK = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    sendDefault: (payload: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

let sdkLoadPromise: Promise<KakaoSDK | null> | null = null;
let kakaoInitAttempted = false;

function isShareDebugEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function logKakaoShare(message: string, detail?: Record<string, unknown>): void {
  if (!isShareDebugEnabled()) return;
  if (detail) {
    console.info(`[kakao-share] ${message}`, detail);
    return;
  }
  console.info(`[kakao-share] ${message}`);
}

function resolveKakaoJavascriptKey(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || '').trim();
}

/** 공개 초대장 `/i/{shareSlug}` 만 허용. 루트·에디터 URL 금지. */
export function isValidKakaoTalkCanonicalUrl(canonicalUrl: string): boolean {
  const trimmed = canonicalUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '') return false;
    if (path.startsWith('/editor')) return false;
    if (path.includes('/invitation/') && !path.startsWith('/i/')) return false;
    return /^\/i\/[^/]+$/.test(path);
  } catch {
    return false;
  }
}

/**
 * Kakao.Share.sendDefault 직전 payload — 순수 함수.
 * title/description/imageUrl은 호출측에서 getInvitationOpenGraphSettings 결과를 전달한다.
 */
export function buildKakaoTalkSharePayload(input: KakaoTalkSharePayloadInput): KakaoTalkFeedPayload {
  const title = input.title.trim() || '초대장';
  const description = input.description.trim() || '초대장을 확인해 주세요.';
  const canonicalUrl = input.canonicalUrl.trim();
  const buttonTitle = input.buttonTitle?.trim() || '초대장 보기';
  const imageUrl = input.imageUrl?.trim() || '';

  if (!isValidKakaoTalkCanonicalUrl(canonicalUrl)) {
    throw new Error('INVALID_KAKAO_SHARE_CANONICAL_URL');
  }

  const link = {
    mobileWebUrl: canonicalUrl,
    webUrl: canonicalUrl,
  };

  return {
    objectType: 'feed',
    content: {
      title,
      description,
      ...(imageUrl ? { imageUrl } : {}),
      link,
    },
    buttons: [
      {
        title: buttonTitle,
        link,
      },
    ],
  };
}

function logPayloadSummary(payload: KakaoTalkFeedPayload, mode: KakaoShareMode): void {
  let imageHost = '';
  let canonicalPath = '';
  try {
    canonicalPath = new URL(payload.content.link.webUrl).pathname;
  } catch {
    canonicalPath = '';
  }
  if (payload.content.imageUrl) {
    try {
      imageHost = new URL(payload.content.imageUrl).hostname;
    } catch {
      imageHost = '';
    }
  }
  logKakaoShare(`mode=${mode}`, {
    canonicalPath,
    titleLength: payload.content.title.length,
    descriptionLength: payload.content.description.length,
    imageHost: imageHost || '(none)',
    hasImage: Boolean(payload.content.imageUrl),
  });
}

function loadKakaoSdkScript(): Promise<KakaoSDK | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Kakao || null));
      existing.addEventListener('error', () => {
        logKakaoShare('sdk-script-load-failed', { reason: 'existing-script-error' });
        resolve(null);
      });
      if (window.Kakao) resolve(window.Kakao);
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.dataset.kakaoSdk = 'true';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.Kakao) {
        logKakaoShare('sdk-script-loaded-but-window.Kakao-missing');
      }
      resolve(window.Kakao || null);
    };
    script.onerror = () => {
      logKakaoShare('sdk-script-load-failed', { reason: 'script-onerror' });
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export async function ensureKakaoInitialized(): Promise<KakaoSDK | null> {
  const key = resolveKakaoJavascriptKey();
  if (!key) {
    logKakaoShare('init-skipped', { reason: 'NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY-missing' });
    return null;
  }

  const kakao = await loadKakaoSdkScript();
  if (!kakao) {
    logKakaoShare('init-failed', { reason: 'window.Kakao-unavailable' });
    return null;
  }

  try {
    if (kakao.isInitialized()) {
      logKakaoShare('init-ok', { alreadyInitialized: true });
      return kakao;
    }
    if (kakaoInitAttempted) {
      logKakaoShare('init-failed', { reason: 'init-already-attempted-but-not-initialized' });
      return null;
    }
    kakaoInitAttempted = true;
    kakao.init(key);
    const ok = kakao.isInitialized();
    logKakaoShare(ok ? 'init-ok' : 'init-failed', {
      alreadyInitialized: false,
      isInitialized: ok,
    });
    return ok ? kakao : null;
  } catch (error) {
    logKakaoShare('init-failed', {
      reason: 'Kakao.init-threw',
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

export function isKakaoJavascriptKeyConfigured(): boolean {
  return Boolean(resolveKakaoJavascriptKey());
}

async function shareNativeOrClipboard(params: {
  title: string;
  description: string;
  canonicalUrl: string;
}): Promise<'native-share' | 'clipboard'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: params.title,
        text: params.description,
        url: params.canonicalUrl,
      });
      logKakaoShare('mode=native-share');
      return 'native-share';
    } catch (error) {
      // AbortError = user cancelled; still try clipboard only when not aborted.
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      logKakaoShare('native-share-failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  await navigator.clipboard.writeText(params.canonicalUrl);
  logKakaoShare('mode=clipboard');
  return 'clipboard';
}

/**
 * KakaoTalk 공유. SDK 성공 시 kakao-sdk, 실패 시 native-share → clipboard.
 * payload title/description/imageUrl은 Editor OG(SSOT) 값을 그대로 전달해야 한다.
 */
export async function shareViaKakaoTalk(content: KakaoTalkSharePayloadInput): Promise<KakaoShareMode> {
  const payload = buildKakaoTalkSharePayload(content);

  const kakao = await ensureKakaoInitialized();
  if (kakao?.Share?.sendDefault) {
    try {
      logPayloadSummary(payload, 'kakao-sdk');
      kakao.Share.sendDefault(payload as unknown as Record<string, unknown>);
      return 'kakao-sdk';
    } catch (error) {
      logKakaoShare('sendDefault-failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  } else {
    logKakaoShare('sdk-unavailable-fallback');
  }

  return shareNativeOrClipboard({
    title: payload.content.title,
    description: payload.content.description,
    canonicalUrl: payload.content.link.webUrl,
  });
}

export const KAKAO_SHARE_FALLBACK_NOTICE =
  '카카오톡 공유를 열지 못해 초대장 링크를 공유했습니다.';

// Keep integrity constant referenced so future CDN pin can re-enable SRI.
void KAKAO_SDK_INTEGRITY;
