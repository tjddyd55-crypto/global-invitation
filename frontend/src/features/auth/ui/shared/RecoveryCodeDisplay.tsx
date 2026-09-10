'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useState } from 'react';
import styles from './RecoveryCodeDisplay.module.css';

type RecoveryCodeDisplayProps = {
  recoveryCode: string;
  title: string;
  description: string;
  warning: string;
  onConfirm: () => void;
  confirmLabel?: string;
};

export default function RecoveryCodeDisplay({
  recoveryCode,
  title,
  description,
  warning,
  onConfirm,
  confirmLabel = '저장했습니다 / 계속하기',
}: RecoveryCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [recoveryCode]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.codeBox} aria-label="복구코드">
        {recoveryCode}
      </div>
      <p className={styles.warning}>{warning}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={() => void copyCode()}>
          {copied ? '복사됨' : '복구코드 복사'}
        </button>
        <button type="button" className={styles.primaryButton} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
