'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminOpsDashboard, type AdminOpsDashboard } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

function money(minor: number, currency = 'USD') {
  return `$${(minor / 100).toFixed(2)} ${currency}`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOpsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void getAdminOpsDashboard()
      .then((next) => {
        if (mounted) setData(next);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Dashboard load failed');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!data && !error) {
    return <div className={styles.loading}>대시보드 데이터를 불러오는 중입니다...</div>;
  }

  const m = data?.metrics;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageDescription}>
            운영 지표 · Runtime: {data?.runtimeEnvironment || '—'} · Payment env:{' '}
            {data?.system?.activePaymentEnvironment || '—'}
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {m && (
        <>
          <section className={styles.grid}>
            {[
              ['전체 회원', m.totalUsers],
              ['오늘 신규 회원', m.usersToday],
              ['이번 달 신규 회원', m.usersMonth],
              ['전체 초대장', m.totalInvitations],
              ['DRAFT', m.draftCount],
              ['PUBLISHED', m.publishedCount],
              ['오늘 생성', m.invitationsToday],
              ['이번 달 생성', m.invitationsMonth],
              ['PAID 건수', m.paidCount],
              ['오늘 매출', money(m.revenueTodayMinor, m.currency)],
              ['이번 달 매출', money(m.revenueMonthMinor, m.currency)],
              ['결제 실패', m.failedPayments],
              ['판매가', money(m.currentSalePriceMinor, m.currency)],
              ['정상가', money(m.currentListPriceMinor, m.currency)],
            ].map(([label, value]) => (
              <article key={String(label)} className={styles.card}>
                <div className={styles.metricLabel}>{label}</div>
                <p className={styles.metricValue}>{value}</p>
              </article>
            ))}
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>Payment Runtime</h2>
            <pre className={styles.pageDescription} style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(data.payment, null, 2)}
            </pre>
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>최근 결제</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Invitation</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.payments.map((p) => (
                    <tr key={String(p.id)}>
                      <td>{String(p.status)}</td>
                      <td>{money(Number(p.chargedAmount || 0), String(p.currency || 'USD'))}</td>
                      <td>
                        <Link href={`/admin/invitations/${p.invitationId}`}>
                          {String(p.invitationTitle || p.invitationId)}
                        </Link>
                      </td>
                      <td>{String(p.createdAt || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>최근 초대장</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.invitations.map((inv) => (
                    <tr key={String(inv.id)}>
                      <td>
                        <Link href={`/admin/invitations/${inv.id}`}>{String(inv.title || inv.id)}</Link>
                      </td>
                      <td>{String(inv.status)}</td>
                      <td>{inv.isPaid ? 'Y' : 'N'}</td>
                      <td>{String(inv.createdAt || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>최근 회원 / Audit</h2>
            <div className={styles.grid}>
              <article className={styles.card}>
                <ul>
                  {data.recent.users.map((u) => (
                    <li key={String(u.id)}>
                      <Link href={`/admin/users/${u.id}`}>{String(u.email || u.id)}</Link>
                    </li>
                  ))}
                </ul>
              </article>
              <article className={styles.card}>
                <ul>
                  {data.recent.audit.map((a) => (
                    <li key={String(a.id)}>
                      {String(a.action)} · {String(a.adminId)} · {String(a.createdAt)}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </>
      )}
    </>
  );
}
