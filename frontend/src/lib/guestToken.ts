'use client';

import { ensureGuestToken, setGuestToken } from '@/src/lib/auth';

/** 비로그인 세션: 항상 문자열 토큰 보장 (localStorage 생성 포함) */
export function getGuestToken(): string {
  return ensureGuestToken();
}

/** 서버가 `x-guest-token` 응답 헤더로 내려준 값을 저장 (서버 발급 토큰으로 동기화) */
export function syncGuestTokenFromResponse(response: Response): void {
  if (typeof window === 'undefined') return;
  const h = response.headers.get('x-guest-token') ?? response.headers.get('X-Guest-Token');
  const trimmed = h?.trim();
  if (trimmed) {
    setGuestToken(trimmed);
  }
}
