'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { cdnImageSrc } from '@/src/lib/image';
import { isValidImageUrl } from '@/src/lib/mediaApi';
import styles from './AppImage.module.css';

const PLACEHOLDER_SRC = '/images/placeholder.png';

type AppImageProps = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
};

function joinClassNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ');
}

export default function AppImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackClassName,
  style,
  priority,
  loading,
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const safeAlt = useMemo(() => (alt || '').trim() || 'image', [alt]);
  const normalizedSrc = useMemo(() => {
    const normalized = (src || '').trim();
    if (!normalized) {
      return '';
    }
    if (normalized.startsWith('blob:') || normalized.startsWith('data:')) {
      return normalized;
    }
    return cdnImageSrc(normalized) || normalized.replace(/^http:\/\//i, 'https://');
  }, [src]);
  const canRenderImage = isValidImageUrl(normalizedSrc) && !hasError;
  const safeWidth = Number.isFinite(width) && (width || 0) > 0 ? (width as number) : 800;
  const safeHeight = Number.isFinite(height) && (height || 0) > 0 ? (height as number) : 600;

  useEffect(() => {
    setUsingPlaceholder(false);
    setHasError(false);
    setIsLoading(true);
  }, [normalizedSrc]);

  const imgSrc = usingPlaceholder ? PLACEHOLDER_SRC : normalizedSrc;

  if (!canRenderImage) {
    return (
      <div
        role="img"
        aria-label={safeAlt}
        className={joinClassNames(styles.placeholder, className, fallbackClassName)}
      />
    );
  }

  const resolvedLoading = priority ? 'eager' : (loading ?? 'lazy');
  const resolvedFetchPriority = priority ? 'high' : 'auto';

  return (
    <div className={styles.frame} style={{ width, height }}>
      {isLoading && (
        <div className={joinClassNames(styles.overlay, fallbackClassName)} />
      )}
      {/* native img: explicit loading + fetchPriority for LCP when priority */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={safeAlt}
        width={safeWidth}
        height={safeHeight}
        loading={resolvedLoading}
        // narrow type for React 18; attribute supported by browsers
        fetchPriority={resolvedFetchPriority as 'high' | 'low' | 'auto'}
        className={className}
        style={{
          objectFit: 'cover',
          ...style,
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          if (!usingPlaceholder) {
            setUsingPlaceholder(true);
            return;
          }
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
