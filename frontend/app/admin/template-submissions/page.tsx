'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listAdminTemplateSubmissions, type AdminTemplateSubmission } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminTemplateSubmissionsPage() {
  const [items, setItems] = useState<AdminTemplateSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const next = await listAdminTemplateSubmissions();
        if (!isMounted) return;
        setItems(next);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '제출 목록을 불러오지 못했습니다.');
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>크리에이터 템플릿 신청</h1>
          <p className={styles.pageDescription}>크리에이터가 제출한 템플릿을 검토하고 승인/반려합니다.</p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Creator</th>
                <th>Category</th>
                <th>Name</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Revision</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.creator?.email || item.creatorId}</td>
                  <td>{item.category}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <div className={styles.helperText}>{item.templateKeyCandidate}</div>
                  </td>
                  <td>
                    <span className={styles.pill}>{item.status}</span>
                  </td>
                  <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-'}</td>
                  <td>r{item.revisionNumber}</td>
                  <td>
                    <Link
                      href={`/admin/template-submissions/${item.id}`}
                      className={`${styles.button} ${styles.secondaryButton}`}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.helperText}>
                    제출된 템플릿이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
