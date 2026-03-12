'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getCreatorDashboardSummary,
  listCreatorTemplateSubmissions,
  submitCreatorTemplateSubmission,
  type CreatorDashboardSummary,
  type TemplateSubmission,
} from '@/src/lib/creatorApi';
import { fetchCurrentUser } from '@/src/lib/auth';
import styles from '../templates/creator.module.css';

function resolveSubmissionBadgeClass(status: TemplateSubmission['status']): string {
  switch (status) {
    case 'SUBMITTED':
      return `${styles.statusBadge} ${styles.statusSubmitted}`;
    case 'APPROVED':
      return `${styles.statusBadge} ${styles.statusApproved}`;
    case 'REJECTED':
      return `${styles.statusBadge} ${styles.statusRejected}`;
    case 'DRAFT':
    default:
      return `${styles.statusBadge} ${styles.statusDraft}`;
  }
}

function resolveTemplateStatusBadgeClass(
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'
): string {
  switch (status) {
    case 'PUBLISHED':
      return `${styles.statusBadge} ${styles.statusPublished}`;
    case 'SUBMITTED':
      return `${styles.statusBadge} ${styles.statusSubmitted}`;
    case 'APPROVED':
      return `${styles.statusBadge} ${styles.statusApproved}`;
    case 'REJECTED':
      return `${styles.statusBadge} ${styles.statusRejected}`;
    case 'DRAFT':
    default:
      return `${styles.statusBadge} ${styles.statusDraft}`;
  }
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<CreatorDashboardSummary | null>(null);
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const me = await fetchCurrentUser();
        if (!me || me.role !== 'CREATOR') {
          router.replace('/signup?role=CREATOR');
          return;
        }

        const [nextSummary, nextSubmissions] = await Promise.all([
          getCreatorDashboardSummary(),
          listCreatorTemplateSubmissions(),
        ]);
        if (!mounted) return;
        setSummary(nextSummary);
        setSubmissions(nextSubmissions);
        setAccessReady(true);
      } catch (loadError) {
        if (!mounted) return;
        const message =
          loadError instanceof Error ? loadError.message : 'Creator dashboard를 불러오지 못했습니다.';
        if (message.includes('CREATOR_ROLE_REQUIRED') || message.includes('UNAUTHORIZED')) {
          router.replace('/signup?role=CREATOR');
          return;
        }
        setError(message);
        setAccessReady(true);
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!accessReady) {
    return <div className={styles.page}>Loading creator access...</div>;
  }

  const handleResubmit = async (submission: TemplateSubmission) => {
    if (submission.status !== 'REJECTED') {
      return;
    }
    setResubmittingId(submission.id);
    setError(null);
    try {
      const updated = await submitCreatorTemplateSubmission(submission.id);
      setSubmissions((current) =>
        current.map((item) => (item.id === submission.id ? updated : item))
      );
      const refreshedSummary = await getCreatorDashboardSummary();
      setSummary(refreshedSummary);
    } catch (resubmitError) {
      setError(resubmitError instanceof Error ? resubmitError.message : '재제출에 실패했습니다.');
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.menuBar} aria-label="creator-dashboard-menu">
        <ul className={styles.menuList}>
          <li>
            <Link href="/creator/templates" className={styles.menuLink}>
              내 템플릿
            </Link>
          </li>
          <li>
            <Link href="/creator/templates/new" className={styles.menuLink}>
              템플릿 만들기
            </Link>
          </li>
          <li>
            <Link href="#stats" className={`${styles.menuLink} ${styles.menuLinkActive}`}>
              통계
            </Link>
          </li>
          <li>
            <Link href="#revenue" className={styles.menuLink}>
              수익
            </Link>
          </li>
          <li>
            <Link href="#settings" className={styles.menuLink}>
              설정
            </Link>
          </li>
        </ul>
      </nav>

      <header className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Creator Dashboard</h1>
          <p className={styles.subtitle}>템플릿 제작/제출/승인/수익 현황을 확인합니다.</p>
        </div>
        <Link href="/creator/templates/new" className={styles.button}>
          템플릿 만들기
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section id="stats" className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.meta}>Published templates</div>
          <strong>{summary?.publishedTemplates ?? 0}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Total templates</div>
          <strong>{summary?.totalTemplates ?? 0}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Draft / Submitted</div>
          <strong>
            {summary?.draftCount ?? 0} / {summary?.submittedCount ?? 0}
          </strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Approved / Rejected</div>
          <strong>
            {summary?.approvedCount ?? 0} / {summary?.rejectedCount ?? 0}
          </strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Total usage</div>
          <strong>{summary?.usageCount ?? 0}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Total views</div>
          <strong>{summary?.viewCount ?? 0}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Total clones</div>
          <strong>{summary?.cloneCount ?? 0}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Total creator revenue</div>
          <strong>${(summary?.revenueTotal ?? 0).toFixed(2)}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Pending payout</div>
          <strong>${(summary?.payoutSummary?.totalPending ?? 0).toFixed(2)}</strong>
        </article>
        <article className={styles.card}>
          <div className={styles.meta}>Paid payout</div>
          <strong>${(summary?.payoutSummary?.totalPaid ?? 0).toFixed(2)}</strong>
        </article>
      </section>

      <section id="revenue" className={styles.section}>
        <p className={styles.meta}>
          누적 정산 건수: {summary?.payoutSummary?.payoutCount ?? 0}
          {summary?.payoutSummary?.lastPaidAt
            ? ` · 마지막 지급일: ${new Date(summary.payoutSummary.lastPaidAt).toLocaleDateString()}`
            : ''}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Template</th>
                <th>Status</th>
                <th>Views</th>
                <th>Clones</th>
                <th>Usage</th>
                <th>Revenue</th>
                <th>Last used</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.templateRevenueStats || []).map((item) => (
                <tr key={item.templateId}>
                  <td>
                    <strong>{item.templateName}</strong>
                    <div className={styles.meta}>{item.templateSlug}</div>
                  </td>
                  <td>
                    <span className={resolveTemplateStatusBadgeClass(item.templateStatus)}>
                      {item.templateStatus}
                    </span>
                  </td>
                  <td>{item.viewCount}</td>
                  <td>{item.cloneCount}</td>
                  <td>{item.usageCount}</td>
                  <td>${item.revenueTotal.toFixed(2)}</td>
                  <td>{item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {(summary?.templateRevenueStats || []).length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.meta}>
                    수익 집계 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>최근 사용 내역</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Used at</th>
                <th>Template</th>
                <th>Invitation</th>
                <th>User type</th>
                <th>Price</th>
                <th>Creator revenue</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentUsages || []).map((usage) => (
                <tr key={usage.usageId}>
                  <td>{new Date(usage.usedAt).toLocaleString()}</td>
                  <td>{usage.templateName}</td>
                  <td>{usage.invitationSlug}</td>
                  <td>{usage.usedBy}</td>
                  <td>${usage.priceSnapshot.toFixed(2)}</td>
                  <td>${usage.creatorRevenue.toFixed(2)}</td>
                </tr>
              ))}
              {(summary?.recentUsages || []).length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.meta}>
                    최근 사용 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section id="settings" className={styles.section}>
        <h2 className={styles.title}>제출 상태</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Template</th>
                <th>Status</th>
                <th>Rejected reason</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <strong>{submission.name}</strong>
                    <div className={styles.meta}>r{submission.revisionNumber}</div>
                  </td>
                  <td>
                    <span className={resolveSubmissionBadgeClass(submission.status)}>{submission.status}</span>
                  </td>
                  <td>
                    {submission.status === 'REJECTED' ? (
                      <span className={styles.noteText}>
                        {submission.reviewNote || '반려 사유가 제공되지 않았습니다.'}
                      </span>
                    ) : (
                      <span className={styles.meta}>-</span>
                    )}
                  </td>
                  <td>{new Date(submission.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <Link
                        href={`/creator/templates/${submission.id}/studio`}
                        className={`${styles.button} ${styles.buttonSecondary}`}
                      >
                        Open Studio
                      </Link>
                      {submission.status === 'REJECTED' && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void handleResubmit(submission)}
                          disabled={resubmittingId === submission.id}
                          data-testid={`creator-dashboard-resubmit-${submission.id}`}
                        >
                          {resubmittingId === submission.id ? 'Resubmitting...' : '재제출'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.meta}>
                    제출 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
