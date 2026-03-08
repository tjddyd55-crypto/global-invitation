'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  deleteAdminTemplate,
  disableAdminTemplate,
  listAdminTemplates,
} from '@/src/lib/adminApi';
import { calculateTemplateRevenue, type TemplateDefinition } from '@/src/templates/registry';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        const nextTemplates = await listAdminTemplates();
        if (!isMounted) return;
        setTemplates(nextTemplates);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '템플릿 목록을 불러오지 못했습니다.');
      }
    }

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDisable = async (templateId: string) => {
    setBusyTemplateId(templateId);
    setError(null);
    try {
      const updated = await disableAdminTemplate(templateId);
      setTemplates((current) =>
        current.map((template) => (template.id === templateId ? updated : template))
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 비활성화에 실패했습니다.');
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    setBusyTemplateId(templateId);
    setError(null);
    try {
      const updated = await deleteAdminTemplate(templateId);
      setTemplates((current) =>
        current.map((template) => (template.id === templateId ? updated : template))
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '템플릿 삭제에 실패했습니다.');
    } finally {
      setBusyTemplateId(null);
    }
  };

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Template Management</h1>
          <p className={styles.pageDescription}>
            템플릿 메타데이터, 가격, 제작자 수익, 활성 상태를 운영합니다.
          </p>
        </div>
        <Link href="/admin/templates/create" className={styles.button}>
          Create Template
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>템플릿 이름</th>
                <th>카테고리</th>
                <th>스타일</th>
                <th>제작자</th>
                <th>가격</th>
                <th>수익비율</th>
                <th>상태</th>
                <th>등록일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const revenue = calculateTemplateRevenue(template.price, template.creatorShare);
                const status = template.isDeleted
                  ? 'Deleted'
                  : template.isActive
                    ? 'Active'
                    : 'Disabled';

                return (
                  <tr key={template.id}>
                    <td>
                      <strong>{template.name}</strong>
                      <div className={styles.helperText}>{template.component}</div>
                    </td>
                    <td>{template.category}</td>
                    <td>{template.style}</td>
                    <td>{template.creatorId || 'SYSTEM'}</td>
                    <td>${template.price.toFixed(2)}</td>
                    <td>
                      {template.creatorShare}% / ${revenue.creatorEarnings.toFixed(2)}
                    </td>
                    <td>
                      <span className={styles.pill}>{status}</span>
                    </td>
                    <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/templates/${template.id}`}
                          className={`${styles.button} ${styles.secondaryButton}`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.secondaryButton}`}
                          onClick={() => handleDisable(template.id)}
                          disabled={busyTemplateId === template.id || !template.isActive}
                        >
                          Disable
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.dangerButton}`}
                          onClick={() => handleDelete(template.id)}
                          disabled={busyTemplateId === template.id || template.isDeleted}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
