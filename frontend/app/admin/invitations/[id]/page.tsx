'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminOpsInvitation } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminInvitationDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminOpsInvitation(params.id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Load failed'));
  }, [params.id]);

  if (!data && !error) return <div className={styles.loading}>불러오는 중...</div>;
  const invitation = (data?.invitation || {}) as Record<string, unknown>;
  const counts = (data?.counts || {}) as Record<string, unknown>;
  const payments = (data?.payments || []) as Array<Record<string, unknown>>;
  const shareSlug = invitation.shareSlug ? String(invitation.shareSlug) : null;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{String(invitation.title || 'Invitation')}</h1>
          <p className={styles.pageDescription}>
            <Link href="/admin/invitations">← Invitations</Link>
            {shareSlug ? (
              <>
                {' '}
                ·{' '}
                <a href={`/i/${shareSlug}`} target="_blank" rel="noreferrer">
                  Public preview
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <section className={styles.section}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ invitation, counts }, null, 2)}</pre>
      </section>
      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Payments</h2>
        <ul>
          {payments.map((p) => (
            <li key={String(p.id)}>
              {String(p.status)} · ${(Number(p.chargedAmount || 0) / 100).toFixed(2)} ·{' '}
              {String(p.providerOrderId || '')}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
