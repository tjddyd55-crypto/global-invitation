'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { cdnImageSrc } from '@/src/lib/image';

type ImageWithFallbackProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  /** 로드 실패·빈 src 시 렌더 (없으면 null) */
  fallback?: ReactNode;
  /** 실패 시 1회 호출 (재귀 재시도 없음) */
  onFailed?: () => void;
};

/**
 * broken image 아이콘을 노출하지 않는 이미지.
 * - 실패 시 fallback 한 번만 표시 (fallback src 재시도 없음)
 */
export default function ImageWithFallback({
  src,
  alt = '',
  className,
  style,
  loading = 'lazy',
  fallback = null,
  onFailed,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const normalized = typeof src === 'string' ? src.trim() : '';
  const resolved = normalized
    ? normalized.startsWith('blob:') || normalized.startsWith('data:')
      ? normalized
      : cdnImageSrc(normalized) || normalized
    : '';

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      style={style}
      src={resolved}
      alt={alt}
      loading={loading}
      onError={() => {
        setFailed(true);
        onFailed?.();
      }}
    />
  );
}
