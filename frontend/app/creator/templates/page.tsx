'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getCreatorDashboardSummary,
  listCreatorTemplateSubmissions,
  type CreatorDashboardSummary,
  type TemplateSubmission,
} from '@/src/lib/creatorApi';
import styles from './creator.module.css';

export default function CreatorTemplatesDashboardPage() {
  const [summary, setSummary] = useState<CreatorDashboardSummary | null>(null);
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [nextSummary, nextSubmissions] = await Promise.all([
          getCreatorDashboardSummary(),
          listCreatorTemplateSubmissions(),
        ]);
        if (!isMounted) return;
        setSummary(nextSummary);
        setSubmissions(nextSubmissions);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Creator dashboard를 불러오지 못했습니다.');
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
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
            <div className={styles.meta}>Usage / Revenue (placeholder)</div>
            <strong>
              {summary.usageCount} / ${summary.revenuePlaceholder.toFixed(2)}
            </strong>
          </article>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
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
                  <td>{item.status}</td>
                  <td>r{item.revisionNumber}</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  <td>
                    <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/creator/templates/${item.id}/studio`}>
                      Open Studio
                    </Link>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.meta}>
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
