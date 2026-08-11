'use client';
/* eslint-disable i18next/no-literal-string */

import type { CSSProperties } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import styles from './OrganizationBrandLogo.module.css';

type OrganizationBrandLogoProps = {
  logo?: string | null;
  name?: string | null;
  englishName?: string | null;
  className?: string;
  /** CSS 변수 --brand-accent 에 반영할 색상 */
  accentColor?: string | null;
  /** Footer 등 축소 표시 */
  compact?: boolean;
  /** decorative duplicate 일 때 alt="" */
  decorative?: boolean;
};

/**
 * ORGANIZATION 브랜드 로고 — contain 맞춤, 없으면 기관명 텍스트 폴백.
 * horizontal / square / vertical 모두 max bounding box 안에서 비율 유지.
 */
export default function OrganizationBrandLogo({
  logo,
  name,
  englishName,
  className,
  accentColor,
  compact = false,
  decorative = false,
}: OrganizationBrandLogoProps) {
  const trimmedName = (name || '').trim();
  const trimmedEnglish = (englishName || '').trim();
  const src = (logo || '').trim();
  const fallbackText = trimmedName || trimmedEnglish || 'ORG';
  const alt = decorative ? '' : trimmedName ? `${trimmedName} 로고` : 'organization logo';

  return (
    <div
      className={[styles.wrap, compact ? styles.wrapCompact : '', className]
        .filter(Boolean)
        .join(' ')}
      style={
        accentColor
          ? ({ ['--brand-accent']: accentColor } as CSSProperties)
          : undefined
      }
      data-testid="organization-brand-logo"
      data-compact={compact ? 'true' : undefined}
    >
      {src ? (
        <ImageWithFallback
          className={styles.logo}
          src={src}
          alt={alt}
          loading="eager"
          fallback={<span className={styles.fallbackText}>{fallbackText.slice(0, 2)}</span>}
        />
      ) : (
        <span className={styles.fallbackText}>{fallbackText.slice(0, 2)}</span>
      )}
    </div>
  );
}
