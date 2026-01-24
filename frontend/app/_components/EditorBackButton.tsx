'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import styles from './EditorBackButton.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type EditorBackButtonProps = {
  fallbackUrl: string;
  label?: string;
};

export default function EditorBackButton({ fallbackUrl, label }: EditorBackButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const navigatingRef = useRef(false);

  const handleBack = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    if (typeof window === 'undefined') {
      router.push(fallbackUrl);
      return;
    }

    const hasHistory = window.history.length > 1;
    const currentPath = window.location.pathname + window.location.search + window.location.hash;

    if (!hasHistory) {
      router.push(fallbackUrl);
      return;
    }

    router.back();
    window.setTimeout(() => {
      const nextPath = window.location.pathname + window.location.search + window.location.hash;
      if (nextPath === currentPath) {
        router.push(fallbackUrl);
      }
    }, 300);
  };

  return (
    <div className={styles.bar}>
      <button type="button" className={styles.button} onClick={handleBack}>
        {label ?? t(I18N_KEYS.common.backToEditor)}
      </button>
    </div>
  );
}
