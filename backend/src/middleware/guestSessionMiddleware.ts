import type { RequestHandler } from 'express';
import { generateGuestToken } from '../lib/guestSession';

function readGuestHeader(req: Parameters<RequestHandler>[0]): string | undefined {
  const raw = req.headers['x-guest-token'];
  if (Array.isArray(raw)) {
    const first = raw[0]?.trim();
    return first || undefined;
  }
  const s = typeof raw === 'string' ? raw.trim() : '';
  return s || undefined;
}

/**
 * 요청에 게스트 토큰을 부착합니다. 헤더가 없으면 새 토큰을 만들고 응답 헤더로 내려줍니다.
 * (클라이언트는 Access-Control-Expose-Headers 로 읽어 localStorage 에 반영 가능)
 */
export const attachGuestSession: RequestHandler = (req, res, next) => {
  let token = readGuestHeader(req);

  if (!token) {
    token = generateGuestToken();
    res.setHeader('x-guest-token', token);
    // eslint-disable-next-line no-console -- 운영 디버그
    console.log('[GUEST TOKEN GENERATED]', token.slice(0, 12) + '…');
  }

  req.guestToken = token;
  next();
};
