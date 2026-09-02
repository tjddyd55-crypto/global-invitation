'use client';

import { useCallback } from 'react';
import AdminButton from './AdminButton';
import styles from './adminUi.module.css';

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    if (loading) return;
    void Promise.resolve(onConfirm());
  }, [loading, onConfirm]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={loading ? undefined : onCancel}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-confirm-title" className={styles.modalTitle}>
          {title}
        </h2>
        <p className={styles.modalDescription}>{description}</p>
        <div className={styles.modalActions}>
          <AdminButton type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
