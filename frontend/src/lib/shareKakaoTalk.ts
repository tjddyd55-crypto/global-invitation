/**
 * KakaoTalk share — KakaoStory 금지. SDK singleton + feed payload.
 */
'use client';

const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
const KAKAO_SDK_INTEGRITY =
  'sha384-TKGoSoHzzmMKFNKmK69z8rWTNpv/6Fv1vgGp8LY2uk6NJmKTigMF9LmR4Ol1TB+9';

type KakaoShareContent = {
  title: string;
  description: string;
  imageUrl?: string;
  canonicalUrl: string;
  buttonTitle?: string;
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

function resolveKakaoJavascriptKey(): string {
  return (process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || '').trim();
}

function loadKakaoSdkScript(): Promise<KakaoSDK | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Kakao || null));
      existing.addEventListener('error', () => resolve(null));
      if (window.Kakao) resolve(window.Kakao);
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.dataset.kakaoSdk = 'true';
    // integrity may vary by CDN version; omit if it blocks load in some environments
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.Kakao || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export async function ensureKakaoInitialized(): Promise<KakaoSDK | null> {
  const key = resolveKakaoJavascriptKey();
  if (!key) return null;
  const kakao = await loadKakaoSdkScript();
  if (!kakao) return null;
  try {
    if (!kakao.isInitialized()) {
      kakao.init(key);
    }
    return kakao;
  } catch {
    return null;
  }
}

export function isKakaoJavascriptKeyConfigured(): boolean {
  return Boolean(resolveKakaoJavascriptKey());
}

export async function shareViaKakaoTalk(content: KakaoShareContent): Promise<'kakao' | 'native' | 'copy'> {
  const title = content.title.trim() || '초대장';
  const description = content.description.trim() || '초대장을 확인해 주세요.';
  const canonicalUrl = content.canonicalUrl.trim();
  const buttonTitle = content.buttonTitle?.trim() || '초대장 보기';

  const kakao = await ensureKakaoInitialized();
  if (kakao?.Share?.sendDefault && canonicalUrl) {
    const payload: Record<string, unknown> = {
      objectType: 'feed',
      content: {
        title,
        description,
        link: {
          mobileWebUrl: canonicalUrl,
          webUrl: canonicalUrl,
        },
        ...(content.imageUrl
          ? {
              imageUrl: content.imageUrl,
            }
          : {}),
      },
      buttons: [
        {
          title: buttonTitle,
          link: {
            mobileWebUrl: canonicalUrl,
            webUrl: canonicalUrl,
          },
        },
      ],
    };
    kakao.Share.sendDefault(payload);
    return 'kakao';
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: description, url: canonicalUrl });
      return 'native';
    } catch {
      // fall through
    }
  }

  await navigator.clipboard.writeText(canonicalUrl);
  return 'copy';
}

// Keep integrity constant referenced so future CDN pin can re-enable SRI.
void KAKAO_SDK_INTEGRITY;
