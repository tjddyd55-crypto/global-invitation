import type { RequestHandler } from 'express';

const requestMap = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

/** 간단한 슬라이딩 윈도우: 게스트 토큰(또는 IP)당 분당 요청 상한 */
export const guestRateLimit: RequestHandler = (req, res, next) => {
  const key = String(req.guestToken || req.ip || 'unknown');

  const now = Date.now();
  const prev = requestMap.get(key) ?? [];
  const recent = prev.filter((ts) => now - ts < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  recent.push(now);
  requestMap.set(key, recent);
  next();
};
