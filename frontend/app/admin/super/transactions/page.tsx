'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/src/components/DataTable';
import styles from '@/src/components/admin/AdminShell.module.css';
import { fetchSuperTransactions, type CreditTransactionRow } from '@/src/lib/superAdminApi';

export default function SuperTransactionsPage() {
  const [rows, setRows] = useState<CreditTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchSuperTransactions(300);
        if (mounted) setRows(items);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : '불러오기 실패');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const columns: DataTableColumn<CreditTransactionRow>[] = [
    { key: 'user_id', header: 'user_id', cell: (r) => <span className="font-mono text-xs">{r.userId}</span> },
    { key: 'amount', header: 'amount', cell: (r) => r.amount },
    { key: 'type', header: 'type', cell: (r) => r.type },
    { key: 'reason', header: 'reason', cell: (r) => r.reason ?? '—' },
    { key: 'before', header: 'before_balance', cell: (r) => r.beforeBalance },
    { key: 'after', header: 'after_balance', cell: (r) => r.afterBalance },
    {
      key: 'created_at',
      header: 'created_at',
      cell: (r) => new Date(r.createdAt).toISOString(),
    },
  ];

  return (
    <section>
      <h1 className={styles.pageTitle}>Transactions</h1>
      <p className={styles.pageDescription}>크레딧 거래 내역입니다.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>로딩 중…</p> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />}
    </section>
  );
}
