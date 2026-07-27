'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { SparklesIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './AuthBrandHeader.module.css';

/**
 * Figma Make Email Start/Verify 화면 상단 브랜드 마크. 항상 `/` 로 링크한다.
 */
export default function AuthBrandHeader() {
  return (
    <Link href="/" className={styles.brand} aria-label="Invite 홈으로">
      <span className={styles.badge}>
        <SparklesIcon size={18} />
      </span>
      <span className={styles.text}>Invite</span>
    </Link>
  );
}
