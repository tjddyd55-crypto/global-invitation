'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import {
  getAdminOpsSystem,
  listAdminOpsAudit,
  updateAdminOpsSystem,
  getAdminSession,
  type AdminSession,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminSystemPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuper = session?.role === 'SUPER_ADMIN';
  const settings = (system?.settings || {}) as Record<string, unknown>;

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
    void getAdminOpsSystem()
      .then(setSystem)
      .catch((err) => setError(err instanceof Error ? err.message : 'System load failed'));
    void listAdminOpsAudit(50)
      .then((res) => setLogs(res.logs))
      .catch(() => undefined);
  }, []);

  async function save(patch: Record<string, unknown>) {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN required');
      return;
    }
    try {
      const res = await updateAdminOpsSystem(patch);
      setSystem((prev) => ({ ...(prev || {}), settings: res.settings }));
      setLogs((await listAdminOpsAudit(50)).logs);
      setStatusMsg('Saved');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>System</h1>
          <p className={styles.pageDescription}>
            Runtime: {String(system?.runtimeEnvironment || '—')} · Channel:{' '}
            {String(system?.channel || 'INTERNATIONAL_USD')} · Currency:{' '}
            {String(system?.currency || 'USD')}
          </p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Runtime Settings</h2>
        {(
          [
            ['paymentsEnabled', 'Payments enabled'],
            ['publishingEnabled', 'Publishing enabled'],
            ['invitationCreationEnabled', 'Invitation creation enabled'],
            ['signupsEnabled', 'Signups enabled'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              disabled={!isSuper}
              onChange={(e) => void save({ [key]: e.target.checked })}
            />{' '}
            {label}
          </label>
        ))}
        <label>
          Support email
          <input
            className={styles.input}
            defaultValue={String(settings.supportEmail || '')}
            disabled={!isSuper}
            onBlur={(e) => void save({ supportEmail: e.target.value.trim() || null })}
          />
        </label>
        <label>
          Active payment environment
          <select
            className={styles.input}
            value={String(settings.activePaymentEnvironment || 'TEST')}
            disabled={!isSuper}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'LIVE') {
                if (
                  !window.confirm(
                    '현재 development 환경입니다. LIVE 결제를 활성화하면 실제 청구가 발생할 수 있습니다. (실제 charge는 여전히 차단됩니다)'
                  )
                ) {
                  return;
                }
                void save({ activePaymentEnvironment: 'LIVE', confirmLiveActivation: true });
              } else {
                void save({ activePaymentEnvironment: 'TEST' });
              }
            }}
          >
            <option value="TEST">TEST</option>
            <option value="LIVE">LIVE</option>
          </select>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Audit Log</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={String(log.id)}>
                  <td>{String(log.createdAt)}</td>
                  <td>{String(log.adminId)}</td>
                  <td>{String(log.action)}</td>
                  <td>
                    {String(log.targetType)} {String(log.targetId || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
