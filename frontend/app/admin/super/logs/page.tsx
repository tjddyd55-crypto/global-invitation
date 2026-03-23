'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/src/components/DataTable';
import styles from '@/src/components/admin/AdminShell.module.css';
import { fetchSuperLogs, type AdminAuditLogRow } from '@/src/lib/superAdminApi';

export default function SuperLogsPage() {
  const [rows, setRows] = useState<AdminAuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payloadRow, setPayloadRow] = useState<AdminAuditLogRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchSuperLogs(300);
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

  const columns: DataTableColumn<AdminAuditLogRow>[] = [
    { key: 'admin_id', header: 'admin_id', cell: (r) => r.adminId },
    { key: 'action', header: 'action', cell: (r) => r.action },
    { key: 'target_type', header: 'target_type', cell: (r) => r.targetType },
    { key: 'target_id', header: 'target_id', cell: (r) => r.targetId ?? '—' },
    {
      key: 'created_at',
      header: 'created_at',
      cell: (r) => new Date(r.createdAt).toISOString(),
    },
    {
      key: 'payload',
      header: '',
      cell: (r) => (
        <button
          type="button"
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={() => setPayloadRow(r)}
        >
          payload JSON
        </button>
      ),
    },
  ];

  return (
    <section>
      <h1 className={styles.pageTitle}>Logs</h1>
      <p className={styles.pageDescription}>관리자 감사 로그입니다.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>로딩 중…</p> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />}

      {payloadRow ? (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modalCard} style={{ maxWidth: 640 }}>
            <h2 className="mb-2 text-lg font-semibold">payload</h2>
            <pre className="max-h-80 overflow-auto rounded bg-gray-100 p-3 text-xs">
              {JSON.stringify(payloadRow.payload ?? null, null, 2)}
            </pre>
            <button type="button" className={`${styles.button} mt-4`} onClick={() => setPayloadRow(null)}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
