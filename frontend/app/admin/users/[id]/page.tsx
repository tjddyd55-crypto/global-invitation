'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createAdminPasswordResetLink, getAdminOpsUser } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void getAdminOpsUser(params.id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Load failed'));
  }, [params.id]);

  const createResetLink = useCallback(async () => {
    setResetBusy(true);
    setError(null);
    try {
      const result = await createAdminPasswordResetLink(params.id);
      setResetUrl(result.resetUrl);
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '링크 생성에 실패했습니다.');
    } finally {
      setResetBusy(false);
    }
  }, [params.id]);

  const copyResetUrl = useCallback(async () => {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [resetUrl]);

  if (!data && !error) return <div className={styles.loading}>불러오는 중...</div>;
  const user = (data?.user || {}) as Record<string, unknown>;
  const invitations = (data?.invitations || []) as Array<Record<string, unknown>>;
  const payments = (data?.payments || []) as Array<Record<string, unknown>>;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>
            {String(user.username || user.email || 'User')}
          </h1>
          <p className={styles.pageDescription}>
            <Link href="/admin/users">← Users</Link> · id {String(user.id)}
            {user.email ? ` · ${String(user.email)}` : ''}
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setShowConfirm(true)}
          disabled={resetBusy}
        >
          비밀번호 재설정 링크 생성
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {showConfirm && (
        <div className={styles.section}>
          <p>이 회원의 비밀번호 재설정 링크를 생성하시겠습니까?</p>
          <p>새 링크를 만들면 이전 미사용 링크는 폐기됩니다.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className={styles.primaryButton} onClick={() => void createResetLink()} disabled={resetBusy}>
              확인
            </button>
            <button type="button" onClick={() => setShowConfirm(false)} disabled={resetBusy}>
              취소
            </button>
          </div>
        </div>
      )}

      {resetUrl && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>비밀번호 재설정 링크가 생성되었습니다.</h2>
          <p style={{ wordBreak: 'break-all' }}>{resetUrl}</p>
          <button type="button" className={styles.primaryButton} onClick={() => void copyResetUrl()}>
            {copied ? '복사됨' : '링크 복사'}
          </button>
          <p>등록된 이메일로 이 링크를 직접 전달해 주세요. 링크는 30분 동안 한 번만 사용할 수 있습니다.</p>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Invitations</h2>
        <ul>
          {invitations.map((inv) => (
            <li key={String(inv.id)}>
              <Link href={`/admin/invitations/${inv.id}`}>{String(inv.title || inv.id)}</Link> ·{' '}
              {String(inv.status)} · paid={String(inv.isPaid)}
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Payments</h2>
        <ul>
          {payments.map((p) => (
            <li key={String(p.id)}>
              <Link href={`/admin/payments?tab=transactions&id=${p.id}`}>
                {String(p.status)} · ${(Number(p.chargedAmount || 0) / 100).toFixed(2)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
