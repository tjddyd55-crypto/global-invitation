'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import { isValidImageUrl } from '@/src/lib/mediaApi';
import styles from './AppImage.module.css';

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
  sizes?: string;
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
  sizes,
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const safeAlt = useMemo(() => (alt || '').trim() || 'image', [alt]);
  const normalizedSrc = useMemo(() => (src || '').trim(), [src]);
  const canRenderImage = isValidImageUrl(normalizedSrc) && !hasError;
  const safeWidth = Number.isFinite(width) && (width || 0) > 0 ? (width as number) : 800;
  const safeHeight = Number.isFinite(height) && (height || 0) > 0 ? (height as number) : 600;

  if (!canRenderImage) {
    return (
      <div
        role="img"
        aria-label={safeAlt}
        className={joinClassNames(styles.placeholder, className, fallbackClassName)}
      />
    );
  }

  return (
    <div className={styles.frame} style={{ width, height }}>
      {isLoading && (
        <div className={joinClassNames(styles.overlay, fallbackClassName)} />
      )}
      <Image
        src={normalizedSrc}
        alt={safeAlt}
        width={safeWidth}
        height={safeHeight}
        loading={priority ? undefined : (loading ?? 'lazy')}
        priority={priority}
        sizes={sizes || '100vw'}
        className={className}
        style={{
          objectFit: 'cover',
          ...style,
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
