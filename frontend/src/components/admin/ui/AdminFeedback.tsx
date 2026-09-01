'use client';

import styles from './adminUi.module.css';

type AdminFeedbackProps = {
  tone?: 'success' | 'error' | 'info';
  message: string | null;
};

export default function AdminFeedback({ tone = 'info', message }: AdminFeedbackProps) {
  if (!message) return null;
  const toneClass =
    tone === 'success' ? styles.feedbackSuccess : tone === 'error' ? styles.feedbackError : styles.feedbackInfo;
  return <p className={toneClass}>{message}</p>;
}

export function AdminPermissionNotice({ message }: { message: string }) {
  return (
    <div className={styles.permissionNotice} role="note">
      <span aria-hidden>🔒</span>
      <span>{message}</span>
    </div>
  );
}
