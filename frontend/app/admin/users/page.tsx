'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAdminOpsUsers } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(search?: string) {
    try {
      const res = await listAdminOpsUsers(search);
      setUsers(res.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Users load failed');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageDescription}>회원 조회 (read-only). 비밀번호/OTP 열람 없음.</p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <form
        className={styles.section}
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
      >
        <input
          className={styles.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="email 또는 user id"
        />
        <button type="submit" className={styles.primaryButton}>
          검색
        </button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Invitations</th>
              <th>Published</th>
              <th>Paid</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={String(u.id)}>
                <td>
                  <Link href={`/admin/users/${u.id}`}>{String(u.email || u.id)}</Link>
                </td>
                <td>{String(u.invitationCount)}</td>
                <td>{String(u.publishedCount)}</td>
                <td>{String(u.paidCount)}</td>
                <td>{String(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
