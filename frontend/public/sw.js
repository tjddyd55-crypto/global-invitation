/**
 * Global Invitation 서비스워커.
 *
 * 설계 원칙:
 * - 모바일 PWA (/m/*) 의 "쉘"만 캐싱한다. 동적 초대장 페이지는 절대 캐시하지 않는다.
 * - API (/api/*) 는 항상 네트워크 (stale 데이터로 인한 결제/구독 상태 오류 방지).
 * - 네비게이션은 "network first → 오프라인 폴백" 전략. 오프라인이면 /offline 로 보낸다.
 * - 정적 자산(_next/static, 아이콘, manifest)은 cache first.
 *
 * 이 파일을 수정하면 CACHE_VERSION 을 반드시 올려 구 캐시를 정리한다.
 */
const CACHE_VERSION = 'gi-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [OFFLINE_URL, '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 다른 오리진은 건드리지 않는다.
  if (url.origin !== self.location.origin) return;

  // API/인증/관리자 요청은 캐시 금지.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) {
    return;
  }

  // 네비게이션(HTML) → network first + 오프라인 폴백.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // 정적 자산 → cache first (_next/static, manifest, 아이콘 등).
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/images') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
