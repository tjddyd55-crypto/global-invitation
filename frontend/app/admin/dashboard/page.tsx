'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { getAdminDashboardSummary, type AdminDashboardSummary } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

const DASHBOARD_METRICS: Array<{
  key: keyof Pick<
    AdminDashboardSummary,
    'totalTemplates' | 'activeTemplates' | 'totalInvitationsCreated' | 'invitationsCreatedToday'
  >;
  label: string;
}> = [
  { key: 'totalTemplates', label: '총 템플릿 수' },
  { key: 'activeTemplates', label: '활성 템플릿 수' },
  { key: 'totalInvitationsCreated', label: '총 초대장 생성 수' },
  { key: 'invitationsCreatedToday', label: '오늘 생성 초대장' },
];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const nextSummary = await getAdminDashboardSummary();
        if (!isMounted) return;
        setSummary(nextSummary);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '대시보드를 불러오지 못했습니다.');
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!summary && !error) {
    return <div className={styles.loading}>대시보드 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageDescription}>
            템플릿 운영 현황과 초대장 생성 지표를 한 곳에서 확인합니다.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {summary && (
        <>
          <section className={styles.grid}>
            {DASHBOARD_METRICS.map((metric) => (
              <article key={metric.key} className={styles.card}>
                <div className={styles.metricLabel}>{metric.label}</div>
                <p className={styles.metricValue}>{summary[metric.key]}</p>
              </article>
            ))}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.pageTitle}>수익 요약</h2>
                <p className={styles.pageDescription}>현재 등록된 활성 템플릿 기준 예상 수익 구조입니다.</p>
              </div>
            </div>
            <div className={styles.grid}>
              <article className={styles.card}>
                <div className={styles.metricLabel}>총 템플릿 가격 합계</div>
                <p className={styles.metricValue}>${summary.revenueSummary.totalTemplatePrice.toFixed(2)}</p>
              </article>
              <article className={styles.card}>
                <div className={styles.metricLabel}>제작자 예상 수익</div>
                <p className={styles.metricValue}>${summary.revenueSummary.totalCreatorEarnings.toFixed(2)}</p>
              </article>
              <article className={styles.card}>
                <div className={styles.metricLabel}>플랫폼 예상 수익</div>
                <p className={styles.metricValue}>${summary.revenueSummary.totalPlatformEarnings.toFixed(2)}</p>
              </article>
              <article className={styles.card}>
                <div className={styles.metricLabel}>Marketplace 구성</div>
                <p className={styles.metricValue}>
                  {summary.systemTemplates} / {summary.creatorTemplates}
                </p>
                <p className={styles.helperText}>SYSTEM / CREATOR TEMPLATE</p>
              </article>
            </div>
          </section>
        </>
      )}
    </>
  );
}
