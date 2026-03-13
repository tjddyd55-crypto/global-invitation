'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getCreatorDashboardSummary,
  listMyTemplates,
  listCreatorTemplateSubmissions,
  submitCreatorTemplateSubmission,
  type CreatorDashboardSummary,
  type TemplateSubmission,
} from '@/src/lib/creatorApi';
import { fetchCurrentUser } from '@/src/lib/auth';
import type { TemplateDefinition } from '@/src/templates/registry';
import styles from './creator.module.css';

function resolveStatusBadgeClass(status: TemplateSubmission['status']): string {
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

export default function CreatorTemplatesDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<CreatorDashboardSummary | null>(null);
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [accessReady, setAccessReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const me = await fetchCurrentUser();
        if (!me || me.role !== 'CREATOR') {
          router.replace('/signup?role=CREATOR');
          return;
        }

        const [nextSummary, nextSubmissions, nextTemplates] = await Promise.all([
          getCreatorDashboardSummary(),
          listCreatorTemplateSubmissions(),
          listMyTemplates(),
        ]);
        if (!isMounted) return;
        setSummary(nextSummary);
        setSubmissions(nextSubmissions);
        setMyTemplates(nextTemplates);
        setAccessReady(true);
      } catch (loadError) {
        if (!isMounted) return;
        const message =
          loadError instanceof Error ? loadError.message : 'Creator dashboard를 불러오지 못했습니다.';
        if (message.includes('CREATOR_ROLE_REQUIRED') || message.includes('UNAUTHORIZED')) {
          router.replace('/signup?role=CREATOR');
          return;
        }
        if (!isMounted) return;
        setError(message);
        setAccessReady(true);
      }
    }

    void load();
    return () => {
      isMounted = false;
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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '재제출에 실패했습니다.');
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.menuBar} aria-label="creator-dashboard-menu">
        <ul className={styles.menuList}>
          <li>
            <Link href="/creator/templates" className={`${styles.menuLink} ${styles.menuLinkActive}`}>
              내 템플릿
            </Link>
          </li>
          <li>
            <Link href="/creator/templates/new" className={styles.menuLink}>
              템플릿 만들기
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#stats" className={styles.menuLink}>
              통계
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#revenue" className={styles.menuLink}>
              수익
            </Link>
          </li>
          <li>
            <Link href="/creator/dashboard#settings" className={styles.menuLink}>
              설정
            </Link>
          </li>
        </ul>
      </nav>

      <header className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Template Creator Studio</h1>
          <p className={styles.subtitle}>
            Creator 템플릿 제작/제출/검수 흐름을 관리합니다.
          </p>
        </div>
        <Link className={styles.button} href="/creator/templates/new">
          Create New Template
        </Link>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {summary && (
        <section className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.meta}>Total templates</div>
            <strong>{summary.totalTemplates}</strong>
          </article>
          <article className={styles.card}>
            <div className={styles.meta}>Published templates</div>
            <strong>{summary.publishedTemplates}</strong>
          </article>
          <article className={styles.card}>
            <div className={styles.meta}>Draft / Submitted</div>
            <strong>
              {summary.draftCount} / {summary.submittedCount}
            </strong>
          </article>
          <article className={styles.card}>
            <div className={styles.meta}>Approved / Rejected</div>
            <strong>
              {summary.approvedCount} / {summary.rejectedCount}
            </strong>
          </article>
          <article className={styles.card}>
            <div className={styles.meta}>Usage / Revenue</div>
            <strong>
              {summary.usageCount} / ${summary.revenueTotal.toFixed(2)}
            </strong>
          </article>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.title} style={{ marginBottom: 12 }}>내 템플릿 (모든 상태)</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Lifecycle</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {myTemplates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <strong>{template.name}</strong>
                    <div className={styles.meta}>{template.templateKey}</div>
                  </td>
                  <td>{template.status}</td>
                  <td>{template.lifecycleStatus || '-'}</td>
                  <td>{template.updatedAt ? new Date(template.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {myTemplates.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.meta}>
                    소유한 템플릿이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Review note</th>
                <th>Revision</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className={styles.meta}>{item.templateKeyCandidate}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <span className={resolveStatusBadgeClass(item.status)}>{item.status}</span>
                  </td>
                  <td>
                    {item.status === 'REJECTED' ? (
                      <span className={styles.noteText}>{item.reviewNote || '반려 사유가 제공되지 않았습니다.'}</span>
                    ) : (
                      <span className={styles.meta}>-</span>
                    )}
                  </td>
                  <td>r{item.revisionNumber}</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <Link
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        href={`/creator/templates/${item.id}/studio`}
                      >
                        Open Studio
                      </Link>
                      {item.status === 'REJECTED' && (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => void handleResubmit(item)}
                          disabled={resubmittingId === item.id}
                          data-testid={`creator-resubmit-${item.id}`}
                        >
                          {resubmittingId === item.id ? 'Resubmitting...' : '재제출'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.meta}>
                    생성된 submission이 없습니다.
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
