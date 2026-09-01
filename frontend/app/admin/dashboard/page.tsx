'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  adminApiJson,
  getAdminOpsDashboard,
  getAdminOpsProviderConfig,
  listAdminVisualTemplates,
  type AdminOpsDashboard,
} from '@/src/lib/adminApi';
import {
  ADMIN_QUICK_ACTIONS,
  formatAuditAction,
  formatConfigured,
  formatInvitationStatus,
  formatMoneyUsd,
  formatPaymentChannel,
  formatPaymentStatus,
  formatRuntimeEnv,
} from '@/src/features/admin/adminDisplay';
import styles from '@/src/components/admin/AdminShell.module.css';

function money(minor: number, currency = 'USD') {
  return `$${(minor / 100).toFixed(2)} ${currency}`;
}

function StatusRow({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: string;
  href?: string;
  warn?: boolean;
}) {
  return (
    <>
      <div className={styles.statusLabel}>{label}</div>
      <div className={`${styles.statusValue} ${warn ? styles.error : ''}`}>
        {href ? (
          <Link href={href} className={styles.statusLink}>
            {value}
          </Link>
        ) : (
          value
        )}
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOpsDashboard | null>(null);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [figma, setFigma] = useState<Record<string, unknown> | null>(null);
  const [figmaActiveCount, setFigmaActiveCount] = useState<number | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      getAdminOpsDashboard(),
      getAdminOpsProviderConfig().catch(() => null),
      adminApiJson<Record<string, unknown>>('/api/admin/figma/config').catch(() => null),
      listAdminVisualTemplates({ source: 'FIGMA_DEFINITION', status: 'ACTIVE' }).catch(() => null),
    ])
      .then(([dashboard, providerConfig, figmaConfig, figmaTemplates]) => {
        if (!mounted) return;
        setData(dashboard);
        setProvider(providerConfig);
        setFigma(figmaConfig);
        setFigmaActiveCount(figmaTemplates?.templates?.length ?? null);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : '대시보드 로드 실패');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!data && !error) {
    return <div className={styles.loading}>대시보드 데이터를 불러오는 중입니다...</div>;
  }

  const m = data?.metrics;
  const payment = (data?.payment || {}) as Record<string, unknown>;
  const testView = (provider?.test || {}) as Record<string, unknown>;
  const liveView = (provider?.live || {}) as Record<string, unknown>;
  const testConfigured =
    Boolean(testView.clientKeyConfigured) &&
    Boolean(testView.secretKeyConfigured) &&
    Boolean(testView.variantKeyConfigured);
  const liveConfigured =
    Boolean(liveView.clientKeyConfigured) &&
    Boolean(liveView.secretKeyConfigured) &&
    Boolean(liveView.variantKeyConfigured);
  const encryptionOk = Boolean(payment.encryptionConfigured ?? provider?.encryptionConfigured);
  const figmaTokenOk = figma?.configured === true || figma?.configured === 'true';

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>관리자 대시보드</h1>
          <p className={styles.pageDescription}>운영 현황</p>
          <div className={styles.badgeRow}>
            <span className={styles.envPill}>
              서비스 환경: {formatRuntimeEnv(data?.runtimeEnvironment)}
            </span>
            <span className={styles.envPill}>
              결제 환경: {String(data?.system?.activePaymentEnvironment || 'TEST')}
            </span>
          </div>
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
              ['작성 중', m.draftCount],
              ['공개 완료', m.publishedCount],
              ['오늘 생성', m.invitationsToday],
              ['이번 달 생성', m.invitationsMonth],
              ['결제 완료 건수', m.paidCount],
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
            <div className={styles.sectionHeader}>
              <h2 className={styles.pageTitle}>빠른 작업</h2>
            </div>
            <div className={styles.quickActions}>
              {ADMIN_QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className={styles.secondaryButton}>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.grid}>
            <article className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.pageTitle}>결제 시스템 상태</h2>
                <Link href="/admin/payments?tab=toss" className={styles.secondaryButton}>
                  결제 설정으로 이동
                </Link>
              </div>
              <div className={styles.statusGrid}>
                <StatusRow label="결제 Provider" value={String(payment.provider || '—')} />
                <StatusRow
                  label="결제 방식"
                  value={formatPaymentChannel(String(payment.mode || 'INTERNATIONAL_USD'))}
                />
                <StatusRow label="통화" value={String(payment.currency || 'USD')} />
                <StatusRow
                  label="현재 결제 환경"
                  value={String(payment.activePaymentEnvironment || data?.system?.activePaymentEnvironment || 'TEST')}
                />
                <StatusRow
                  label="가격 설정"
                  value={formatMoneyUsd(m.currentSalePriceMinor)}
                  href="/admin/payments?tab=pricing"
                />
                <StatusRow
                  label="암호화 상태"
                  value={encryptionOk ? '설정됨' : '미설정 ⚠'}
                  href="/admin/payments?tab=toss"
                  warn={!encryptionOk}
                />
                <StatusRow
                  label="Toss TEST 키"
                  value={testConfigured ? '설정됨' : '미설정'}
                  href="/admin/payments?tab=toss"
                />
                <StatusRow
                  label="Toss LIVE 키"
                  value={liveConfigured ? '설정됨' : '미설정'}
                  href="/admin/payments?tab=toss"
                />
                <StatusRow label="국내 KRW 결제" value="사용 안 함" />
                <StatusRow
                  label="Mock 허용 여부"
                  value={payment.mockAllowed ? '허용' : '비허용'}
                />
              </div>
              <button
                type="button"
                className={styles.accordionSummary}
                onClick={() => setShowDiagnostics((prev) => !prev)}
              >
                {showDiagnostics ? '상세 진단 정보 숨기기' : '상세 진단 정보 보기'}
              </button>
              {showDiagnostics ? (
                <pre className={styles.pageDescription} style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(data?.payment, null, 2)}
                </pre>
              ) : null}
            </article>

            <article className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.pageTitle}>Figma 연동 상태</h2>
                <Link href="/admin/system?tab=figma" className={styles.secondaryButton}>
                  Figma 설정
                </Link>
              </div>
              <div className={styles.statusGrid}>
                <StatusRow
                  label="Figma Token"
                  value={figmaTokenOk ? '설정됨' : '미설정'}
                  href="/admin/system?tab=figma"
                  warn={!figmaTokenOk}
                />
                <StatusRow
                  label="암호화 설정"
                  value={formatConfigured(figma?.encryptionConfigured as boolean | string | null | undefined)}
                  href="/admin/system?tab=figma"
                />
                <StatusRow
                  label="활성 Figma 템플릿"
                  value={figmaActiveCount == null ? '—' : `${figmaActiveCount}개`}
                  href="/admin/visual-templates"
                />
              </div>
              <div className={styles.quickActions} style={{ marginTop: 16 }}>
                <Link href="/admin/visual-templates/new" className={styles.secondaryButton}>
                  새 템플릿 만들기
                </Link>
                <Link href="/admin/visual-templates/import" className={styles.secondaryButton}>
                  Figma 가져오기
                </Link>
              </div>
            </article>
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>최근 결제</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>결제금액</th>
                    <th>초대장</th>
                    <th>결제 요청일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.payments.map((p) => (
                    <tr key={String(p.id)}>
                      <td>{formatPaymentStatus(String(p.status))}</td>
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
                    <th>제목</th>
                    <th>상태</th>
                    <th>결제</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.invitations.map((inv) => (
                    <tr key={String(inv.id)}>
                      <td>
                        <Link href={`/admin/invitations/${inv.id}`}>{String(inv.title || inv.id)}</Link>
                      </td>
                      <td>{formatInvitationStatus(String(inv.status))}</td>
                      <td>{inv.isPaid ? '결제 완료' : '미결제'}</td>
                      <td>{String(inv.createdAt || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.pageTitle}>최근 회원 / 관리자 변경</h2>
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
                      {formatAuditAction(String(a.action))} · {String(a.adminId)} ·{' '}
                      {String(a.createdAt)}
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
