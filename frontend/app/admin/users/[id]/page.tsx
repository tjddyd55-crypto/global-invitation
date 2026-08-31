'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminOpsUser } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminOpsUser(params.id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Load failed'));
  }, [params.id]);

  if (!data && !error) return <div className={styles.loading}>불러오는 중...</div>;
  const user = (data?.user || {}) as Record<string, unknown>;
  const invitations = (data?.invitations || []) as Array<Record<string, unknown>>;
  const payments = (data?.payments || []) as Array<Record<string, unknown>>;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{String(user.email || 'User')}</h1>
          <p className={styles.pageDescription}>
            <Link href="/admin/users">← Users</Link> · id {String(user.id)}
          </p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
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
