'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useState } from 'react';
import { useAuth } from '@/src/shared/hooks';
import {
  changeAccountPassword,
  regenerateRecoveryCode,
} from '@/src/shared/auth';
import { mapAuthErrorCode } from '@/src/shared/auth/authErrorMessages';
import RecoveryCodeDisplay from './RecoveryCodeDisplay';
import formStyles from './AuthFormFields.module.css';

export default function AccountSecurityScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [regenPassword, setRegenPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);

  const changePassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy) return;
      if (newPassword !== newPasswordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        await changeAccountPassword({ currentPassword, newPassword });
        setMessage('비밀번호가 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
      } catch (err) {
        setError(err instanceof Error ? err.message : mapAuthErrorCode(undefined, '변경 실패'));
      } finally {
        setBusy(false);
      }
    },
    [busy, currentPassword, newPassword, newPasswordConfirm]
  );

  const regenCode = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const result = await regenerateRecoveryCode(regenPassword);
        setNewRecoveryCode(result.recoveryCode);
        setRegenPassword('');
      } catch (err) {
        setError(err instanceof Error ? err.message : mapAuthErrorCode(undefined, '재발급 실패'));
      } finally {
        setBusy(false);
      }
    },
    [busy, regenPassword]
  );

  if (newRecoveryCode) {
    return (
      <RecoveryCodeDisplay
        recoveryCode={newRecoveryCode}
        title="새 복구코드"
        description="복구코드가 재발급되었습니다."
        warning="이 코드는 지금 한 번만 표시됩니다. 이전 복구코드는 더 이상 사용할 수 없습니다."
        onConfirm={() => setNewRecoveryCode(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <h1>계정 보안</h1>
      <section style={{ marginTop: 24 }}>
        <h2>계정 정보</h2>
        <p>아이디: {user?.username || '-'}</p>
        <p>이메일: {user?.email || '-'}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>비밀번호 변경</h2>
        <form className={formStyles.form} onSubmit={changePassword}>
          <label className={formStyles.label}>
            현재 비밀번호
            <input
              className={formStyles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label className={formStyles.label}>
            새 비밀번호
            <input
              className={formStyles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className={formStyles.label}>
            새 비밀번호 확인
            <input
              className={formStyles.input}
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className={formStyles.submitButton} type="submit" disabled={busy}>
            비밀번호 변경
          </button>
        </form>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>복구코드 재발급</h2>
        <form className={formStyles.form} onSubmit={regenCode}>
          <label className={formStyles.label}>
            현재 비밀번호
            <input
              className={formStyles.input}
              type="password"
              value={regenPassword}
              onChange={(e) => setRegenPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className={formStyles.submitButton} type="submit" disabled={busy}>
            복구코드 재발급
          </button>
        </form>
      </section>

      {error && <p className={formStyles.error}>{error}</p>}
      {message && <p className={formStyles.hint}>{message}</p>}
    </div>
  );
}
