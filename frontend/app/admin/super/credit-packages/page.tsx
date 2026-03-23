'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/src/components/DataTable';
import styles from '@/src/components/admin/AdminShell.module.css';
import {
  createSuperCreditPackage,
  fetchSuperCreditPackages,
  patchSuperCreditPackage,
  type CreditPackageRow,
} from '@/src/lib/superAdminApi';

type Draft = {
  name: string;
  credits: string;
  priceCents: string;
  sortOrder: string;
  active: boolean;
};

function rowDraft(row: CreditPackageRow): Draft {
  return {
    name: row.name,
    credits: String(row.credits),
    priceCents: String(row.priceCents),
    sortOrder: String(row.sortOrder),
    active: row.active,
  };
}

export default function SuperCreditPackagesPage() {
  const [rows, setRows] = useState<CreditPackageRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    credits: '',
    priceCents: '0',
    sortOrder: '0',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchSuperCreditPackages();
      setRows(items);
      const next: Record<string, Draft> = {};
      for (const r of items) {
        next[r.id] = rowDraft(r);
      }
      setDrafts(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveRow = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    const credits = Number(d.credits);
    const priceCents = Number(d.priceCents);
    const sortOrder = Number(d.sortOrder);
    if (Number.isNaN(credits) || Number.isNaN(priceCents) || Number.isNaN(sortOrder)) {
      setError('숫자 필드를 확인하세요.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const updated = await patchSuperCreditPackage(id, {
        name: d.name,
        credits,
        priceCents,
        sortOrder,
        active: d.active,
      });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setDrafts((prev) => ({ ...prev, [id]: rowDraft(updated) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSavingId(null);
    }
  };

  const createPackage = async () => {
    const credits = Number(createForm.credits);
    if (!createForm.name.trim() || Number.isNaN(credits)) {
      setError('이름과 크레딧 수를 입력하세요.');
      return;
    }
    setError(null);
    try {
      await createSuperCreditPackage({
        name: createForm.name.trim(),
        credits,
        priceCents: Number(createForm.priceCents) || 0,
        sortOrder: Number(createForm.sortOrder) || 0,
      });
      setCreateForm({ name: '', credits: '', priceCents: '0', sortOrder: '0' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '생성 실패');
    }
  };

  const columns: DataTableColumn<CreditPackageRow>[] = [
    {
      key: 'name',
      header: 'name',
      cell: (r) => (
        <input
          className="w-full min-w-[120px] rounded border border-gray-300 px-2 py-1"
          value={drafts[r.id]?.name ?? ''}
          onChange={(e) => patchDraft(r.id, { name: e.target.value })}
        />
      ),
    },
    {
      key: 'credits',
      header: 'credits',
      cell: (r) => (
        <input
          type="number"
          className="w-24 rounded border border-gray-300 px-2 py-1"
          value={drafts[r.id]?.credits ?? ''}
          onChange={(e) => patchDraft(r.id, { credits: e.target.value })}
        />
      ),
    },
    {
      key: 'priceCents',
      header: 'price (cents)',
      cell: (r) => (
        <input
          type="number"
          className="w-24 rounded border border-gray-300 px-2 py-1"
          value={drafts[r.id]?.priceCents ?? ''}
          onChange={(e) => patchDraft(r.id, { priceCents: e.target.value })}
        />
      ),
    },
    {
      key: 'sort',
      header: 'sort',
      cell: (r) => (
        <input
          type="number"
          className="w-20 rounded border border-gray-300 px-2 py-1"
          value={drafts[r.id]?.sortOrder ?? ''}
          onChange={(e) => patchDraft(r.id, { sortOrder: e.target.value })}
        />
      ),
    },
    {
      key: 'active',
      header: 'active',
      cell: (r) => (
        <input
          type="checkbox"
          checked={drafts[r.id]?.active ?? false}
          onChange={(e) => patchDraft(r.id, { active: e.target.checked })}
        />
      ),
    },
    {
      key: 'save',
      header: '',
      cell: (r) => (
        <button
          type="button"
          className={`${styles.button} ${styles.secondaryButton}`}
          disabled={savingId === r.id}
          onClick={() => void saveRow(r.id)}
        >
          저장
        </button>
      ),
    },
  ];

  return (
    <section>
      <h1 className={styles.pageTitle}>Credit Packages</h1>
      <p className={styles.pageDescription}>판매/노출용 크레딧 패키지를 관리합니다.</p>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={`${styles.section} mb-6`}>
        <h2 className="mb-3 text-base font-semibold">새 패키지</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            name
            <input
              className="rounded border border-gray-300 px-2 py-1"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            credits
            <input
              type="number"
              className="w-28 rounded border border-gray-300 px-2 py-1"
              value={createForm.credits}
              onChange={(e) => setCreateForm((p) => ({ ...p, credits: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            priceCents
            <input
              type="number"
              className="w-28 rounded border border-gray-300 px-2 py-1"
              value={createForm.priceCents}
              onChange={(e) => setCreateForm((p) => ({ ...p, priceCents: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            sortOrder
            <input
              type="number"
              className="w-24 rounded border border-gray-300 px-2 py-1"
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: e.target.value }))}
            />
          </label>
          <button type="button" className={styles.button} onClick={() => void createPackage()}>
            추가
          </button>
        </div>
      </div>

      {loading ? <p className={styles.loading}>로딩 중…</p> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />}
    </section>
  );
}
