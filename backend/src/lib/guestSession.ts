import crypto from 'crypto';

/** 서버 발급 게스트 세션 토큰 (클라이언트 UUID와 구분 가능한 길이/엔트로피) */
export function generateGuestToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
