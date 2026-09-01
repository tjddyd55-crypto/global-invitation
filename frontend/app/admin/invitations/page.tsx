'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  formatConceptLabel,
  formatInvitationListTitle,
  formatInvitationStatus,
} from '@/src/features/admin/adminDisplay';
import {
  archiveAdminOpsInvitation,
  listAdminOpsInvitations,
  updateAdminOpsInvitationStatus,
} from '@/src/lib/adminApi';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminFeedback,
  AdminInput,
  AdminSelect,
} from '@/src/components/admin/ui';
import ui from '@/src/components/admin/ui/adminUi.module.css';
import styles from '@/src/components/admin/AdminShell.module.css';

type ConfirmState =
  | { type: 'archive'; id: string; title: string; isPaid: boolean }
  | { type: 'unpublish'; id: string; title: string }
  | null;

export default function AdminInvitationsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [filters, setFilters] = useState({
    concept: '',
    status: '',
    paid: '',
    q: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await listAdminOpsInvitations(filters);
      setRows(res.invitations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '초대장 목록을 불러오지 못했습니다.');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runConfirmedAction() {
    if (!confirm) return;
    setBusyId(confirm.id);
    try {
      if (confirm.type === 'archive') {
        await archiveAdminOpsInvitation(confirm.id);
        setFeedback('초대장이 보관(삭제) 처리되었습니다. 결제 기록은 유지됩니다.');
      } else {
        await updateAdminOpsInvitationStatus(confirm.id, 'DRAFT');
        setFeedback('초대장 공개 상태가 작성 중으로 변경되었습니다.');
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '작업 처리에 실패했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>초대장 관리</h1>
          <p className={styles.pageDescription}>초대장 조회 및 운영 상태 관리</p>
        </div>
      </div>
      {error ? <AdminFeedback tone="error" message={error} /> : null}
      {feedback ? <AdminFeedback tone="success" message={feedback} /> : null}

      <form
        className={styles.section}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className={styles.fieldGrid}>
          <AdminSelect
            value={filters.concept}
            onChange={(e) => setFilters((f) => ({ ...f, concept: e.target.value }))}
          >
            <option value="">종류</option>
            <option value="WEDDING">웨딩</option>
            <option value="FUNERAL">장례</option>
            <option value="GENERAL">일반 행사</option>
            <option value="ORGANIZATION">단체/조직</option>
          </AdminSelect>
          <AdminSelect
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">상태</option>
            <option value="DRAFT">작성 중</option>
            <option value="PUBLISHED">공개 완료</option>
            <option value="SHARED">공유됨</option>
          </AdminSelect>
          <AdminSelect
            value={filters.paid}
            onChange={(e) => setFilters((f) => ({ ...f, paid: e.target.value }))}
          >
            <option value="">결제</option>
            <option value="true">결제 완료</option>
            <option value="false">미결제</option>
          </AdminSelect>
          <AdminInput
            placeholder="ID / 제목 / slug 검색"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <div className={ui.buttonGroup} style={{ marginTop: 12 }}>
          <AdminButton type="submit" variant="primary">
            필터
          </AdminButton>
        </div>
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
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const id = String(inv.id);
              const title = formatInvitationListTitle(inv.title, inv.id);
              const isPaid = Boolean(inv.isPaid);
              return (
                <tr key={id}>
                  <td>
                    <Link href={`/admin/invitations/${id}`}>{title}</Link>
                  </td>
                  <td>{String(inv.ownerEmail || inv.userId || 'guest')}</td>
                  <td>{formatConceptLabel(String(inv.concept || ''))}</td>
                  <td>{String(inv.visualTemplateId || inv.templateKey)}</td>
                  <td>{formatInvitationStatus(String(inv.status))}</td>
                  <td>{isPaid ? '결제 완료' : '미결제'}</td>
                  <td>{String(inv.createdAt)}</td>
                  <td>
                    <div className={ui.rowActions}>
                      <AdminButton href={`/admin/invitations/${id}`} variant="secondary" size="sm">
                        상세
                      </AdminButton>
                      {String(inv.status) === 'PUBLISHED' ? (
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          loading={busyId === id}
                          onClick={() =>
                            setConfirm({ type: 'unpublish', id, title })
                          }
                        >
                          비공개
                        </AdminButton>
                      ) : null}
                      <AdminButton
                        variant="danger"
                        size="sm"
                        loading={busyId === id}
                        onClick={() =>
                          setConfirm({ type: 'archive', id, title, isPaid })
                        }
                      >
                        삭제
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        open={confirm?.type === 'archive'}
        title="초대장을 삭제하시겠습니까?"
        description={
          confirm?.type === 'archive'
            ? `${confirm.title} 초대장을 보관(soft delete) 처리합니다. 사용자 화면에서 더 이상 표시되지 않으며, 결제/RSVP 기록은 보존됩니다.${
                confirm.isPaid ? ' (결제 완료 초대장 — 거래 기록은 유지됩니다.)' : ''
              }`
            : ''
        }
        confirmLabel="삭제"
        variant="danger"
        loading={Boolean(busyId)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />

      <AdminConfirmDialog
        open={confirm?.type === 'unpublish'}
        title="초대장을 비공개로 변경하시겠습니까?"
        description={
          confirm?.type === 'unpublish'
            ? `${confirm.title} 초대장의 상태를 작성 중으로 변경합니다.`
            : ''
        }
        confirmLabel="변경"
        loading={Boolean(busyId)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />
    </>
  );
}
