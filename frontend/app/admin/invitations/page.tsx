'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAdminOpsInvitations } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminInvitationsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [filters, setFilters] = useState({
    concept: '',
    status: '',
    paid: '',
    q: '',
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await listAdminOpsInvitations(filters);
      setRows(res.invitations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Invitations</h1>
          <p className={styles.pageDescription}>초대장 운영 조회 (콘텐츠 직접 수정 없음)</p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <form
        className={styles.section}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className={styles.grid}>
          <select
            className={styles.input}
            value={filters.concept}
            onChange={(e) => setFilters((f) => ({ ...f, concept: e.target.value }))}
          >
            <option value="">Concept</option>
            <option value="WEDDING">WEDDING</option>
            <option value="FUNERAL">FUNERAL</option>
            <option value="GENERAL">GENERAL</option>
            <option value="ORGANIZATION">ORGANIZATION</option>
          </select>
          <select
            className={styles.input}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="SHARED">SHARED</option>
          </select>
          <select
            className={styles.input}
            value={filters.paid}
            onChange={(e) => setFilters((f) => ({ ...f, paid: e.target.value }))}
          >
            <option value="">Paid</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
          <input
            className={styles.input}
            placeholder="id / title / slug"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <button type="submit" className={styles.primaryButton}>
          Filter
        </button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Concept</th>
              <th>Template</th>
              <th>Status</th>
              <th>Paid</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={String(inv.id)}>
                <td>
                  <Link href={`/admin/invitations/${inv.id}`}>{String(inv.title || inv.id)}</Link>
                </td>
                <td>{String(inv.ownerEmail || inv.userId || 'guest')}</td>
                <td>{String(inv.concept || '—')}</td>
                <td>{String(inv.visualTemplateId || inv.templateKey)}</td>
                <td>{String(inv.status)}</td>
                <td>{inv.isPaid ? 'Y' : 'N'}</td>
                <td>{String(inv.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
