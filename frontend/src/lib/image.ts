function normalizeCdnBase(): string {
  return (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
}

/**
 * R2 객체 키(또는 선행 슬래시 없는 경로) → CDN 절대 URL
 */
export function buildImageUrl(key: string): string {
  const base = normalizeCdnBase();
  const k = key.trim().replace(/^\/+/, '').split('?')[0];
  if (!k) {
    return '';
  }
  if (!base) {
    return '';
  }
  return `${base}/${k}`;
}

/**
 * DB/API에 저장된 값(URL 또는 키)을 항상 `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` 기준으로 정규화.
 * blob:/data:/외부 HTTPS(비 R2)는 그대로 둔다.
 */
export function cdnImageSrc(stored: string | null | undefined): string {
  const raw = (stored ?? '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('blob:') || raw.startsWith('data:')) {
    return raw;
  }

  const noQuery = raw.split('?')[0];
  const base = normalizeCdnBase();

  const asHttps = noQuery.startsWith('http://') ? noQuery.replace(/^http:\/\//i, 'https://') : noQuery;

  if (base && asHttps.startsWith('https://') && asHttps.startsWith(base)) {
    const key = asHttps.slice(base.length).replace(/^\/+/, '');
    return buildImageUrl(key);
  }

  if (asHttps.startsWith('https://')) {
    try {
      const path = new URL(asHttps).pathname.replace(/^\/+/, '');
      if (path.startsWith('invitation/') || path.startsWith('e2e/')) {
        return buildImageUrl(path);
      }
    } catch {
      /* ignore */
    }
    return asHttps;
  }

  // Next.js public 정적 경로 (/images, /icons 등)는 CDN 키로 취급하지 않는다.
  if (noQuery.startsWith('/')) {
    return noQuery;
  }

  return buildImageUrl(noQuery);
}
