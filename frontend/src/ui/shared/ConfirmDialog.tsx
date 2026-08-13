'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

export type ConfirmDialogVariant = 'primary' | 'danger';

export type ConfirmDialogProps = {
  open: boolean;
  busy?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  testId?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * App confirm SSOT. Backdrop click does not dismiss.
 */
export default function ConfirmDialog({
  open,
  busy = false,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'primary',
  testId = 'confirm-dialog',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" data-testid={`${testId}-backdrop`}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-testid={testId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descId} className={styles.body}>
          {description}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={variant === 'danger' ? `${styles.confirm} ${styles.confirmDanger}` : styles.confirm}
            onClick={onConfirm}
            disabled={busy}
            data-testid={`${testId}-confirm`}
          >
            {busy ? `${confirmLabel} 중...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
