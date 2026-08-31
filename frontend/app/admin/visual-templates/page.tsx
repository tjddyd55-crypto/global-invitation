'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activateAdminVisualTemplate,
  archiveAdminVisualTemplate,
  getAdminSession,
  listAdminVisualTemplates,
  patchAdminVisualTemplate,
  reorderAdminVisualTemplates,
  syncAdminVisualTemplates,
  type AdminSession,
  type AdminVisualCatalogDrift,
  type AdminVisualTemplateRow,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type Filters = {
  concept: string;
  status: string;
  source: string;
  visible: string;
  featured: string;
  new: string;
  q: string;
};

const EMPTY_FILTERS: Filters = {
  concept: '',
  status: '',
  source: '',
  visible: '',
  featured: '',
  new: '',
  q: '',
};

export default function AdminVisualTemplatesPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [rows, setRows] = useState<AdminVisualTemplateRow[]>([]);
  const [drift, setDrift] = useState<AdminVisualCatalogDrift | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  const isSuper = session?.role === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminVisualTemplates({
        concept: filters.concept || undefined,
        status: filters.status || undefined,
        source: filters.source || undefined,
        visible: filters.visible || undefined,
        featured: filters.featured || undefined,
        new: filters.new || undefined,
        q: filters.q || undefined,
      });
      setRows(res.templates);
      setDrift(res.drift);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedForReorder = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.templateKey.localeCompare(b.templateKey)),
    [rows]
  );

  async function toggle(row: AdminVisualTemplateRow, field: 'isVisible' | 'isFeatured' | 'isNew' | 'isPremium') {
    try {
      await patchAdminVisualTemplate(row.id, { [field]: !row[field] });
      setStatusMsg(`${row.templateKey} ${field} updated`);
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function changeStatus(row: AdminVisualTemplateRow, status: string) {
    try {
      const patch: Record<string, unknown> = { status };
      if (status === 'ARCHIVED' || status === 'HIDDEN') patch.isVisible = false;
      await patchAdminVisualTemplate(row.id, patch);
      setStatusMsg(`${row.templateKey} → ${status}`);
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Status update failed');
    }
  }

  async function onDropReorder(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const next = [...sortedForReorder];
    const from = next.findIndex((r) => r.id === dragId);
    const to = next.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    try {
      await reorderAdminVisualTemplates(next.map((r) => ({ id: r.id })));
      setStatusMsg('Sort order saved');
      await load();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Reorder failed');
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Visual Templates</h1>
          <p className={styles.pageDescription}>
            CODE Registry ∩ DB 운영 카탈로그 · marketplace Template(`/admin/templates`)와 별축
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void syncAdminVisualTemplates(false).then(load)}
          >
            Sync from registry
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      {drift && (
        <section className={styles.grid}>
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
        </section>
      )}

      <section className={styles.section}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {(
            [
              ['concept', ['', 'WEDDING', 'GENERAL', 'ORGANIZATION']],
              ['status', ['', 'DRAFT', 'QA_READY', 'ACTIVE', 'HIDDEN', 'ARCHIVED']],
              ['source', ['', 'CODE', 'FIGMA_DEFINITION']],
              ['visible', ['', 'true', 'false']],
              ['featured', ['', 'true', 'false']],
              ['new', ['', 'true', 'false']],
            ] as const
          ).map(([key, options]) => (
            <select
              key={key}
              className={styles.input}
              value={filters[key]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
            >
              {options.map((opt) => (
                <option key={opt || 'all'} value={opt}>
                  {opt ? `${key}:${opt}` : `${key}:all`}
                </option>
              ))}
            </select>
          ))}
          <input
            className={styles.input}
            placeholder="Search key / name"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
        </div>

        {loading ? (
          <p className={styles.pageDescription}>Loading…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Thumb</th>
                  <th>Key</th>
                  <th>Name</th>
                  <th>Concept</th>
                  <th>Src</th>
                  <th>Ver</th>
                  <th>Status</th>
                  <th>Vis</th>
                  <th>Feat</th>
                  <th>New</th>
                  <th>Prem</th>
                  <th>Sort</th>
                  <th>Usage</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedForReorder.map((row) => (
                  <tr
                    key={row.id}
                    draggable
                    onDragStart={() => setDragId(row.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void onDropReorder(row.id)}
                    style={{ opacity: dragId === row.id ? 0.5 : 1 }}
                  >
                    <td>⋮⋮</td>
                    <td>
                      {row.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.thumbnailUrl} alt="" width={48} height={48} style={{ objectFit: 'cover' }} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/visual-templates/${row.templateKey}`}>{row.templateKey}</Link>
                      {!row.registryOk ? (
                        <span className={styles.error}> REGISTRY_MISSING</span>
                      ) : null}
                    </td>
                    <td>{row.displayNameKo}</td>
                    <td>{row.concept}</td>
                    <td>{row.sourceType}</td>
                    <td>{row.activeVersion ?? '—'}</td>
                    <td>
                      <select
                        className={styles.input}
                        value={row.status}
                        onChange={(e) => void changeStatus(row, e.target.value)}
                      >
                        {['DRAFT', 'QA_READY', 'ACTIVE', 'HIDDEN', 'ARCHIVED'].map((s) => (
                          <option key={s} value={s} disabled={s === 'ARCHIVED' && !isSuper}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isVisible}
                        onChange={() => void toggle(row, 'isVisible')}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isFeatured}
                        onChange={() => void toggle(row, 'isFeatured')}
                      />
                    </td>
                    <td>
                      <input type="checkbox" checked={row.isNew} onChange={() => void toggle(row, 'isNew')} />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isPremium}
                        onChange={() => void toggle(row, 'isPremium')}
                      />
                    </td>
                    <td>{row.sortOrder}</td>
                    <td>{row.usage.total}</td>
                    <td>{new Date(row.updatedAt).toLocaleString()}</td>
                    <td>
                      <Link href={`/templates/${row.templateKey}/preview`} target="_blank">
                        Preview
                      </Link>
                      {isSuper ? (
                        row.status === 'ARCHIVED' ? (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() =>
                              void activateAdminVisualTemplate(row.id).then(load).catch((e) =>
                                setStatusMsg(e instanceof Error ? e.message : 'Activate failed')
                              )
                            }
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() =>
                              void archiveAdminVisualTemplate(row.id).then(load).catch((e) =>
                                setStatusMsg(e instanceof Error ? e.message : 'Archive failed')
                              )
                            }
                          >
                            Archive
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
