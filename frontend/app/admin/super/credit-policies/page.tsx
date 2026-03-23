'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/src/components/DataTable';
import styles from '@/src/components/admin/AdminShell.module.css';
import {
  fetchSuperCreditPolicies,
  patchSuperCreditPolicy,
  type CreditPolicyRow,
} from '@/src/lib/superAdminApi';

type Draft = { cost: string; active: boolean };

export default function SuperCreditPoliciesPage() {
  const [rows, setRows] = useState<CreditPolicyRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchSuperCreditPolicies();
      setRows(items);
      const next: Record<string, Draft> = {};
      for (const r of items) {
        next[r.key] = { cost: String(r.cost), active: r.active };
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

  const setDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const saveRow = async (key: string) => {
    const d = drafts[key];
    if (!d) return;
    const cost = Number(d.cost);
    if (Number.isNaN(cost)) {
      setError('cost는 숫자여야 합니다.');
      return;
    }
    setSavingKey(key);
    setError(null);
    try {
      const updated = await patchSuperCreditPolicy(key, { cost, active: d.active });
      setRows((prev) => prev.map((r) => (r.key === key ? updated : r)));
      setDrafts((prev) => ({ ...prev, [key]: { cost: String(updated.cost), active: updated.active } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSavingKey(null);
    }
  };

  const columns: DataTableColumn<CreditPolicyRow>[] = [
    { key: 'key', header: 'key', cell: (r) => <span className="font-mono text-xs">{r.key}</span> },
    {
      key: 'cost',
      header: 'cost',
      cell: (r) => (
        <input
          type="number"
          className="w-28 rounded border border-gray-300 px-2 py-1"
          value={drafts[r.key]?.cost ?? ''}
          onChange={(e) => setDraft(r.key, { cost: e.target.value })}
        />
      ),
    },
    {
      key: 'active',
      header: 'active',
      cell: (r) => (
        <input
          type="checkbox"
          checked={drafts[r.key]?.active ?? false}
          onChange={(e) => setDraft(r.key, { active: e.target.checked })}
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
          disabled={savingKey === r.key}
          onClick={() => void saveRow(r.key)}
        >
          저장
        </button>
      ),
    },
  ];

  return (
    <section>
      <h1 className={styles.pageTitle}>Credit Policies</h1>
      <p className={styles.pageDescription}>크레딧 소비 단가 정책을 수정합니다. 행 단위로 저장합니다.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>로딩 중…</p> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} />}
    </section>
  );
}
