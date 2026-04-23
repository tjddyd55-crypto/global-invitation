/**
 * 플랫폼 감지 규칙 — 서버(middleware)와 클라이언트가 동일한 기준을 쓴다.
 */

export type Platform = 'mobile' | 'desktop';

export const UI_PREF_COOKIE = 'ui_pref';

// iPadOS 13+ 는 "Macintosh" 로 UA 를 쓴다. 완전 분리는 쉽지 않으므로
// (1) iPhone/Android/모바일 토큰이 있으면 mobile
// (2) iPad 계열(터치가 있는 Mac)도 mobile 취급
// 로 단순화한다.
const MOBILE_UA_REGEX = /iPhone|iPod|Android.+Mobile|Mobile Safari|Opera Mini|IEMobile/i;
const IPAD_UA_REGEX = /iPad|(Macintosh.*Safari.*Touch)/i;

export function detectPlatformFromUA(userAgent: string | null | undefined): Platform {
  if (!userAgent) return 'desktop';
  if (MOBILE_UA_REGEX.test(userAgent)) return 'mobile';
  if (IPAD_UA_REGEX.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function normalizePlatformPref(raw: string | null | undefined): Platform | null {
  if (raw === 'mobile' || raw === 'desktop') return raw;
  return null;
}

/**
 * 우선순위: 쿠키(유저 오버라이드) > UA
 */
export function resolvePlatform(input: {
  userAgent: string | null | undefined;
  uiPrefCookie: string | null | undefined;
}): Platform {
  const override = normalizePlatformPref(input.uiPrefCookie);
  if (override) return override;
  return detectPlatformFromUA(input.userAgent);
}
