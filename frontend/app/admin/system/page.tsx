'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import {
  getAdminOpsSystem,
  listAdminOpsAudit,
  updateAdminOpsSystem,
  getAdminSession,
  getAdminVisualTemplateDrift,
  adminApiJson,
  type AdminSession,
  type AdminVisualCatalogDrift,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminSystemPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [drift, setDrift] = useState<AdminVisualCatalogDrift | null>(null);
  const [figma, setFigma] = useState<Record<string, unknown> | null>(null);
  const [figmaToken, setFigmaToken] = useState('');
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
    void getAdminVisualTemplateDrift()
      .then(setDrift)
      .catch(() => undefined);
    void adminApiJson<Record<string, unknown>>('/api/admin/figma/config')
      .then(setFigma)
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

      {drift && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>Visual Template Catalog Drift</h2>
          <div className={styles.grid}>
            {[
              ['Registry', drift.registryTemplateCount],
              ['Catalog DB', drift.catalogEntryCount],
              ['Active+Visible', drift.activeVisibleCount],
              ['Missing in DB', drift.registryMissingCount],
              ['Orphan in DB', drift.dbOrphanCount],
            ].map(([label, value]) => (
              <article key={String(label)} className={styles.card}>
                <div className={styles.metricLabel}>{label}</div>
                <p className={styles.metricValue}>{value}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Figma Integration</h2>
        <p className={styles.pageDescription}>
          configured={String(figma?.configured)} · source={String(figma?.source)} · encryption=
          {String(figma?.encryptionConfigured)} · masked={String(figma?.tokenMasked || '—')}
        </p>
        <label>
          Access token (SUPER_ADMIN, encrypted DB)
          <input
            className={styles.input}
            type="password"
            value={figmaToken}
            disabled={!isSuper}
            onChange={(e) => setFigmaToken(e.target.value)}
            placeholder="figd_…"
          />
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!isSuper}
            onClick={() =>
              void adminApiJson('/api/admin/figma/config', {
                method: 'PUT',
                body: JSON.stringify({ accessToken: figmaToken }),
              })
                .then((view) => {
                  setFigma(view as Record<string, unknown>);
                  setFigmaToken('');
                  setStatusMsg('Figma token saved');
                })
                .catch((err) => setStatusMsg(err instanceof Error ? err.message : 'Save failed'))
            }
          >
            Save token
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              void adminApiJson('/api/admin/figma/test', { method: 'POST', body: '{}' })
                .then((res) => setStatusMsg(`Figma: ${JSON.stringify(res)}`))
                .catch((err) => setStatusMsg(err instanceof Error ? err.message : 'Test failed'))
            }
          >
            연결 확인
          </button>
        </div>
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
