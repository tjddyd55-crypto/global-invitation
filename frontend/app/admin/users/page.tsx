'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deactivateAdminOpsUser, listAdminOpsUsers } from '@/src/lib/adminApi';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminFeedback,
  AdminInput,
} from '@/src/components/admin/ui';
import ui from '@/src/components/admin/ui/adminUi.module.css';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<{ id: string; email: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(search?: string) {
    try {
      const res = await listAdminOpsUsers(search);
      setUsers(res.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 목록을 불러오지 못했습니다.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deactivateUser() {
    if (!confirmUser) return;
    setBusyId(confirmUser.id);
    try {
      await deactivateAdminOpsUser(confirmUser.id);
      setFeedback('회원이 비활성화되었습니다. 기존 초대장·결제 기록은 유지됩니다.');
      setConfirmUser(null);
      await load(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 비활성화에 실패했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>회원 관리</h1>
          <p className={styles.pageDescription}>회원 조회 및 비활성화 (영구 삭제 없음)</p>
        </div>
      </div>
      {error ? <AdminFeedback tone="error" message={error} /> : null}
      {feedback ? <AdminFeedback tone="success" message={feedback} /> : null}

      <form
        className={styles.section}
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
      >
        <AdminInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이메일 또는 회원 ID 검색"
        />
        <div className={ui.buttonGroup} style={{ marginTop: 12 }}>
          <AdminButton type="submit" variant="primary">
            검색
          </AdminButton>
        </div>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이메일</th>
              <th>상태</th>
              <th>초대장 수</th>
              <th>공개 초대장</th>
              <th>결제 건수</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const id = String(u.id);
              const deactivated = Boolean(u.deactivatedAt);
              return (
                <tr key={id}>
                  <td>
                    <Link href={`/admin/users/${id}`}>{String(u.email || id)}</Link>
                  </td>
                  <td>{deactivated ? '비활성화' : '활성'}</td>
                  <td>{String(u.invitationCount)}</td>
                  <td>{String(u.publishedCount)}</td>
                  <td>{String(u.paidCount)}</td>
                  <td>{String(u.createdAt)}</td>
                  <td>
                    <div className={ui.rowActions}>
                      <AdminButton href={`/admin/users/${id}`} variant="secondary" size="sm">
                        상세
                      </AdminButton>
                      {!deactivated ? (
                        <AdminButton
                          variant="danger"
                          size="sm"
                          loading={busyId === id}
                          onClick={() =>
                            setConfirmUser({ id, email: String(u.email || id) })
                          }
                        >
                          비활성화
                        </AdminButton>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        open={Boolean(confirmUser)}
        title="회원을 비활성화하시겠습니까?"
        description={
          confirmUser
            ? `${confirmUser.email} 계정의 로그인을 차단합니다. 초대장·결제·감사 기록은 보존됩니다.`
            : ''
        }
        confirmLabel="비활성화"
        variant="danger"
        loading={Boolean(busyId)}
        onCancel={() => setConfirmUser(null)}
        onConfirm={() => void deactivateUser()}
      />
    </>
  );
}
