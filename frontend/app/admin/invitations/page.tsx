'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatConceptLabel, formatInvitationStatus } from '@/src/features/admin/adminDisplay';
import { listAdminOpsInvitations } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminInvitationsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [filters, setFilters] = useState({
    concept: '',
    status: '',
    paid: '',
    q: '',
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await listAdminOpsInvitations(filters);
      setRows(res.invitations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>초대장 관리</h1>
          <p className={styles.pageDescription}>초대장 운영 조회 (콘텐츠 직접 수정 없음)</p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <form
        className={styles.section}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className={styles.grid}>
          <select
            className={styles.input}
            value={filters.concept}
            onChange={(e) => setFilters((f) => ({ ...f, concept: e.target.value }))}
          >
            <option value="">종류</option>
            <option value="WEDDING">웨딩</option>
            <option value="FUNERAL">장례</option>
            <option value="GENERAL">일반 행사</option>
            <option value="ORGANIZATION">단체/조직</option>
          </select>
          <select
            className={styles.input}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">상태</option>
            <option value="DRAFT">작성 중</option>
            <option value="PUBLISHED">공개 완료</option>
            <option value="SHARED">공유됨</option>
          </select>
          <select
            className={styles.input}
            value={filters.paid}
            onChange={(e) => setFilters((f) => ({ ...f, paid: e.target.value }))}
          >
            <option value="">결제</option>
            <option value="true">결제 완료</option>
            <option value="false">미결제</option>
          </select>
          <input
            className={styles.input}
            placeholder="ID / 제목 / slug 검색"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <button type="submit" className={styles.primaryButton}>
          필터
        </button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>제목</th>
              <th>회원</th>
              <th>종류</th>
              <th>템플릿</th>
              <th>상태</th>
              <th>결제</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={String(inv.id)}>
                <td>
                  <Link href={`/admin/invitations/${inv.id}`}>{String(inv.title || inv.id)}</Link>
                </td>
                <td>{String(inv.ownerEmail || inv.userId || 'guest')}</td>
                <td>{formatConceptLabel(String(inv.concept || ''))}</td>
                <td>{String(inv.visualTemplateId || inv.templateKey)}</td>
                <td>{formatInvitationStatus(String(inv.status))}</td>
                <td>{inv.isPaid ? '결제 완료' : '미결제'}</td>
                <td>{String(inv.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
