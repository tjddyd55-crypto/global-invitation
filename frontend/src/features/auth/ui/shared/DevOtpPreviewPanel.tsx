'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import styles from './DevOtpPreviewPanel.module.css';

export interface DevOtpPreviewPanelProps {
  previewCode: string;
  /** Verify 화면에서 OTP 칸에 채우기 */
  onFillInputs?: (code: string) => void;
  variant?: 'start' | 'verify';
}

/**
 * development mock 전용 OTP 미리보기.
 * previewCode 가 서버에서 온 경우에만 렌더한다 (없으면 DOM 미생성).
 */
export default function DevOtpPreviewPanel({
  previewCode,
  onFillInputs,
  variant = 'start',
}: DevOtpPreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!/^\d{6}$/.test(previewCode)) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // clipboard API 미지원/거부 시 fallback
    }
    try {
      const area = document.createElement('textarea');
      area.value = previewCode;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.panel} data-testid="dev-otp-preview-panel" data-variant={variant}>
      <div className={styles.badgeRow}>
        <span className={styles.badge}>TEST ONLY</span>
      </div>
      <p className={styles.label}>개발 테스트용 인증번호</p>
      <div className={styles.codeRow}>
        <span className={styles.code} data-testid="dev-otp-preview-code">
          {previewCode}
        </span>
        <button type="button" className={styles.action} onClick={() => void handleCopy()} data-testid="dev-otp-copy">
          복사
        </button>
        {onFillInputs && (
          <button
            type="button"
            className={styles.actionPrimary}
            onClick={() => onFillInputs(previewCode)}
            data-testid="dev-otp-fill"
          >
            인증번호 입력
          </button>
        )}
      </div>
      <p className={styles.hint}>실제 운영 환경에서는 표시되지 않습니다.</p>
      {copied && (
        <p className={styles.toast} role="status" data-testid="dev-otp-copied-toast">
          인증번호가 복사되었습니다
        </p>
      )}
    </div>
  );
}
