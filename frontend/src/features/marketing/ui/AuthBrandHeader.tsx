'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './AuthBrandHeader.module.css';

export type AuthBrandHeaderVariant = 'corner' | 'inline';

/**
 * Figma Make Auth shell 브랜드.
 * - corner: Desktop Email Start/Verify 좌측 상단 absolute logo
 * - inline: Mobile header 옆 인라인 logo
 */
export default function AuthBrandHeader({ variant = 'inline' }: { variant?: AuthBrandHeaderVariant }) {
  return (
    <Link
      href="/"
      className={variant === 'corner' ? styles.corner : styles.inline}
      aria-label="Invite 홈으로"
      data-testid="auth-brand-header"
    >
      <SparklesIcon size={variant === 'corner' ? 18 : 16} />
      <span>Invite</span>
    </Link>
  );
}
