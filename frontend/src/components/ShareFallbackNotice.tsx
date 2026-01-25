'use client';

import { useRef } from 'react';
import styles from './ShareFallbackNotice.module.css';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type ShareFallbackNoticeProps = {
  url: string;
  onClose?: () => void;
};

export default function ShareFallbackNotice({ url, onClose }: ShareFallbackNoticeProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = () => {
    inputRef.current?.select();
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return;
      } catch {
        // fallback to manual selection
      }
    }
    handleSelect();
  };

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>{t(I18N_KEYS.share.manualCopyTitle)}</span>
          {onClose && (
            <button type="button" className={styles.closeButton} onClick={onClose}>
              {t(I18N_KEYS.common.close)}
            </button>
          )}
        </div>
        <p className={styles.description}>{t(I18N_KEYS.share.manualCopyDescription)}</p>
        <div className={styles.urlRow}>
          <input
            ref={inputRef}
            type="text"
            className={styles.urlInput}
            value={url}
            readOnly
            onFocus={handleSelect}
            aria-label={t(I18N_KEYS.share.manualCopyInputLabel)}
          />
          <button type="button" className={styles.copyButton} onClick={handleCopy}>
            {t(I18N_KEYS.share.manualCopyAction)}
          </button>
        </div>
        <p className={styles.hint}>{t(I18N_KEYS.share.manualCopyHint)}</p>
      </div>
    </div>
  );
}
