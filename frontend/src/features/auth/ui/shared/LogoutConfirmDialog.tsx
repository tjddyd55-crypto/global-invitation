'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useId, useRef } from 'react';
import styles from './LogoutConfirmDialog.module.css';

export interface LogoutConfirmDialogProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 로그아웃 확인 모달.
 * 외부 클릭으로 닫히지 않는다 (프로젝트 confirm SSOT).
 */
export default function LogoutConfirmDialog({ open, busy, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-testid="logout-confirm-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          로그아웃할까요?
        </h2>
        <p id={descId} className={styles.body}>
          현재 기기에서 로그인 상태가 해제됩니다.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={styles.confirm}
            onClick={onConfirm}
            disabled={busy}
            data-testid="logout-confirm-button"
          >
            {busy ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
    </div>
  );
}
