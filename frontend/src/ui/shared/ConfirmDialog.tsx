'use client';

import { useEffect, useId, useRef } from 'react';
import { useI18n } from '@/src/contexts/I18nContext';
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
import styles from './ConfirmDialog.module.css';

export type ConfirmDialogVariant = 'primary' | 'danger';

export type ConfirmDialogProps = {
  open: boolean;
  busy?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Invitation locale for editor dialogs. Omit to use service locale (My Invitations). */
  locale?: ProductLocaleId;
  variant?: ConfirmDialogVariant;
  testId?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * App confirm SSOT. Backdrop click does not dismiss.
 * Default labels: `locale` → invitation locale; otherwise service locale.
 */
export default function ConfirmDialog({
  open,
  busy = false,
  title,
  description,
  confirmLabel,
  cancelLabel,
  locale,
  variant = 'primary',
  testId = 'confirm-dialog',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { t: serviceT } = useI18n();
  const labelT = (key: string) => (locale ? invitationT(locale, key) : serviceT(key));
  const resolvedConfirm = confirmLabel ?? labelT('common.confirm');
  const resolvedCancel = cancelLabel ?? labelT('common.cancel');
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
            {resolvedCancel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={variant === 'danger' ? `${styles.confirm} ${styles.confirmDanger}` : styles.confirm}
            onClick={onConfirm}
            disabled={busy}
            data-testid={`${testId}-confirm`}
          >
            {busy ? `${resolvedConfirm}…` : resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
