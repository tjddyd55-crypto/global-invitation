'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  activateAdminVisualTemplate,
  archiveAdminVisualTemplate,
  adminApiJson,
  getAdminSession,
  getAdminVisualTemplate,
  patchAdminVisualTemplate,
  type AdminSession,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminVisualTemplateDetailPage() {
  const params = useParams();
  const idOrKey = String(params?.id || '');
  const [session, setSession] = useState<AdminSession | null>(null);
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayNameKo: '',
    displayNameEn: '',
    descriptionKo: '',
    descriptionEn: '',
    thumbnailUrl: '',
    previewUrl: '',
    sortOrder: 0,
  });

  const isSuper = session?.role === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    if (!idOrKey) return;
    try {
      const res = await getAdminVisualTemplate(idOrKey);
      setTemplate(res.template);
      setForm({
        displayNameKo: String(res.template.displayNameKo || ''),
        displayNameEn: String(res.template.displayNameEn || ''),
        descriptionKo: String(res.template.descriptionKo || ''),
        descriptionEn: String(res.template.descriptionEn || ''),
        thumbnailUrl: String(res.template.thumbnailUrl || ''),
        previewUrl: String(res.template.previewUrl || ''),
        sortOrder: Number(res.template.sortOrder || 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [idOrKey]);

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
    void load();
  }, [load]);

  async function save() {
    if (!template) return;
    try {
      await patchAdminVisualTemplate(String(template.id), {
        ...form,
        thumbnailUrl: form.thumbnailUrl || null,
        previewUrl: form.previewUrl || null,
      });
      setStatusMsg('Saved');
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function qaReady(versionId: string) {
    try {
      await adminApiJson(
        `/api/admin/visual-templates/${encodeURIComponent(String(template?.id))}/versions/${encodeURIComponent(versionId)}/qa-ready`,
        { method: 'POST', body: '{}' }
      );
      setStatusMsg('Marked QA_READY');
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'QA ready failed');
    }
  }

  async function activateVersion(versionId: string) {
    try {
      await adminApiJson(
        `/api/admin/visual-templates/${encodeURIComponent(String(template?.id))}/versions/${encodeURIComponent(versionId)}/activate`,
        { method: 'POST', body: '{}' }
      );
      setStatusMsg('Version activated (isVisible=false by default)');
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Activate failed');
    }
  }

  if (!template && !error) {
    return <div className={styles.loading}>Loading…</div>;
  }

  const versions = Array.isArray(template?.versions) ? (template?.versions as Array<Record<string, unknown>>) : [];
  const isFigma = String(template?.sourceType || '') === 'FIGMA_DEFINITION';

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <Link href="/admin/visual-templates">← Visual Templates</Link>
          <h1 className={styles.pageTitle}>{String(template?.templateKey || idOrKey)}</h1>
          <p className={styles.pageDescription}>
            {String(template?.concept)} · {String(template?.sourceType)} · status {String(template?.status)}
            {template?.registryOk === false ? ' · REGISTRY_MISSING' : ''}
          </p>
        </div>
        <Link
          className={styles.primaryButton}
          href={`/templates/${encodeURIComponent(String(template?.templateKey || ''))}/preview`}
          target="_blank"
        >
          Preview
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Metadata</h2>
        {(
          [
            ['displayNameKo', 'Display name (KO)'],
            ['displayNameEn', 'Display name (EN)'],
            ['descriptionKo', 'Description (KO)'],
            ['descriptionEn', 'Description (EN)'],
            ['thumbnailUrl', 'Thumbnail URL'],
            ['previewUrl', 'Preview URL'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} style={{ display: 'block', marginBottom: 8 }}>
            {label}
            <input
              className={styles.input}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label style={{ display: 'block', marginBottom: 8 }}>
          Sort order
          <input
            className={styles.input}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
          />
        </label>
        <button type="button" className={styles.primaryButton} onClick={() => void save()}>
          Save metadata
        </button>
        {isSuper ? (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                void archiveAdminVisualTemplate(String(template?.id))
                  .then(load)
                  .catch((e) => setStatusMsg(e instanceof Error ? e.message : 'Archive failed'))
              }
            >
              Archive
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                void activateAdminVisualTemplate(String(template?.id))
                  .then(load)
                  .catch((e) => setStatusMsg(e instanceof Error ? e.message : 'Activate failed'))
              }
            >
              Activate
            </button>
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Versions</h2>
        <p className={styles.pageDescription}>
          Active version id: {String(template?.activeVersionId || '—')}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Version</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th>Activated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={String(v.id)}>
                  <td>v{String(v.version)}</td>
                  <td>{String(v.sourceType)}</td>
                  <td>{String(v.status)}</td>
                  <td>{String(v.createdAt || '')}</td>
                  <td>{String(v.activatedAt || '—')}</td>
                  <td>
                    {isFigma ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => void qaReady(String(v.id))}
                        >
                          QA Ready
                        </button>
                        {isSuper ? (
                          <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => void activateVersion(String(v.id))}
                          >
                            Activate
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      '—'
                    )}
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
