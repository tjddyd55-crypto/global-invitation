'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getInvitationAnalytics,
  type InvitationAnalyticsSummary,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type AdminInvitationAnalyticsPageProps = {
  params: {
    id: string;
  };
};

const SUMMARY_CARDS: Array<{
  key: keyof Pick<
    InvitationAnalyticsSummary,
    'totalViews' | 'uniqueSessions' | 'viewsToday' | 'viewsLast7Days'
  >;
  label: string;
}> = [
  { key: 'totalViews', label: '총 조회 수' },
  { key: 'uniqueSessions', label: '고유 방문 세션' },
  { key: 'viewsToday', label: '오늘 조회 수' },
  { key: 'viewsLast7Days', label: '최근 7일 조회 수' },
];

const DEVICE_CARDS: Array<{
  key: keyof InvitationAnalyticsSummary['deviceBreakdown'];
  label: string;
}> = [
  { key: 'mobile', label: 'Mobile' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'desktop', label: 'Desktop' },
  { key: 'unknown', label: 'Unknown' },
];

export default function AdminInvitationAnalyticsPage({
  params,
}: AdminInvitationAnalyticsPageProps) {
  const invitationId = params.id;
  const [analytics, setAnalytics] = useState<InvitationAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const nextAnalytics = await getInvitationAnalytics(invitationId);
        if (!isMounted) return;
        setAnalytics(nextAnalytics);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '분석 데이터를 불러오지 못했습니다.');
      }
    }

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [invitationId]);

  if (!analytics && !error) {
    return <div className={styles.loading}>분석 데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!analytics) {
    return <p className={styles.error}>분석 데이터를 찾을 수 없습니다.</p>;
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Invitation Analytics</h1>
          <p className={styles.pageDescription}>
            초대장 `{analytics.invitation.title || analytics.invitation.slug}`의 조회, 유입, RSVP 전환
            지표입니다.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href={`/admin/invitations/${invitationId}/guests`} className={`${styles.button} ${styles.secondaryButton}`}>
            Guest List
          </Link>
          <Link
            href={`/invitation/${analytics.invitation.slug}`}
            target="_blank"
            rel="noreferrer"
            className={styles.button}
          >
            공개 페이지 보기
          </Link>
        </div>
      </div>

      <section className={styles.grid}>
        {SUMMARY_CARDS.map((metric) => (
          <article key={metric.key} className={styles.card}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <p className={styles.metricValue}>{analytics[metric.key]}</p>
          </article>
        ))}
        <article className={styles.card}>
          <div className={styles.metricLabel}>RSVP 전환율</div>
          <p className={styles.metricValue}>{(analytics.conversionRate * 100).toFixed(1)}%</p>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.pageTitle}>디바이스 비중</h2>
            <p className={styles.pageDescription}>페이지 조회 이벤트 기준 디바이스 분포입니다.</p>
          </div>
        </div>
        <div className={styles.grid}>
          {DEVICE_CARDS.map((device) => (
            <article key={device.key} className={styles.card}>
              <div className={styles.metricLabel}>{device.label}</div>
              <p className={styles.metricValue}>{analytics.deviceBreakdown[device.key]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.pageTitle}>유입 경로</h2>
            <p className={styles.pageDescription}>정규화된 referrer bucket 기준 조회 수입니다.</p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics.referrerBreakdown.map((item) => (
                <tr key={item.referrer}>
                  <td>{item.referrer}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
              {analytics.referrerBreakdown.length === 0 && (
                <tr>
                  <td colSpan={2} className={styles.helperText}>
                    아직 기록된 유입 경로가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.pageTitle}>RSVP 요약</h2>
            <p className={styles.pageDescription}>기존 RSVP 데이터를 조회 분석과 함께 확인합니다.</p>
          </div>
        </div>
        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.metricLabel}>총 RSVP 제출 수</div>
            <p className={styles.metricValue}>{analytics.rsvpSummary.totalGuests}</p>
          </article>
          <article className={styles.card}>
            <div className={styles.metricLabel}>총 인원 수</div>
            <p className={styles.metricValue}>{analytics.rsvpSummary.totalPeople}</p>
          </article>
          <article className={styles.card}>
            <div className={styles.metricLabel}>참석 인원</div>
            <p className={styles.metricValue}>{analytics.rsvpSummary.attendingPeople}</p>
          </article>
          <article className={styles.card}>
            <div className={styles.metricLabel}>불참 인원</div>
            <p className={styles.metricValue}>{analytics.rsvpSummary.declinedPeople}</p>
          </article>
          <article className={styles.card}>
            <div className={styles.metricLabel}>미정 인원</div>
            <p className={styles.metricValue}>{analytics.rsvpSummary.maybePeople}</p>
          </article>
        </div>
      </section>
    </>
  );
}
