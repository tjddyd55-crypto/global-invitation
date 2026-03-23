'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/src/components/DataTable';
import styles from '@/src/components/admin/AdminShell.module.css';
import { fetchSuperUsers, postSuperUserCredits, type SuperUserRow } from '@/src/lib/superAdminApi';

export default function SuperUsersPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<SuperUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    userId: string;
    email: string;
    sign: 1 | -1;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchSuperUsers(q);
      setRows(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const openDialog = (row: SuperUserRow, sign: 1 | -1) => {
    setDialog({ userId: row.userId, email: row.email, sign });
    setAmount('');
    setReason('');
  };

  const submitAdjust = async () => {
    if (!dialog) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || !reason.trim()) {
      setError('금액(양수)과 사유를 입력하세요.');
      return;
    }
    const delta = dialog.sign * Math.trunc(n);
    setSubmitting(true);
    setError(null);
    try {
      await postSuperUserCredits(dialog.userId, delta, reason.trim());
      setDialog(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<SuperUserRow>[] = [
    { key: 'user_id', header: 'user_id', cell: (r) => <span className="font-mono text-xs">{r.userId}</span> },
    { key: 'email', header: 'email', cell: (r) => r.email || '—' },
    { key: 'balance', header: 'balance', cell: (r) => r.balance },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => openDialog(r, 1)}
          >
            +크레딧
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => openDialog(r, -1)}
          >
            -크레딧
          </button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <h1 className={styles.pageTitle}>Users</h1>
      <p className={styles.pageDescription}>이메일로 검색하고 크레딧을 조정합니다.</p>
      <div className="mb-4">
        <input
          type="search"
          placeholder="email 검색"
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>로딩 중…</p> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.userId} />}

      {dialog ? (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modalCard}>
            <h2 className="mb-2 text-lg font-semibold">
              {dialog.sign === 1 ? '+크레딧' : '-크레딧'} — {dialog.email}
            </h2>
            <div className={styles.form}>
              <label className={styles.field}>
                <span>금액 (양수)</span>
                <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>사유</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setDialog(null)}>
                  취소
                </button>
                <button type="button" className={styles.button} disabled={submitting} onClick={() => void submitAdjust()}>
                  실행
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
