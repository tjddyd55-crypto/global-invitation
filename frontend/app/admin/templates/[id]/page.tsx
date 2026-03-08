'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminTemplateForm from '@/src/components/admin/AdminTemplateForm';
import { getAdminTemplate, updateAdminTemplate } from '@/src/lib/adminApi';
import type { TemplateDefinition } from '@/src/templates/registry';
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;

    let isMounted = true;

    async function loadTemplate() {
      try {
        const nextTemplate = await getAdminTemplate(templateId);
        if (!isMounted) return;
        setTemplate(nextTemplate);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '템플릿을 불러오지 못했습니다.');
      }
    }

    void loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  if (!template && !error) {
    return <div className={styles.loading}>템플릿 정보를 불러오는 중입니다...</div>;
  }

  if (error || !template) {
    return <p className={styles.error}>{error || '템플릿을 찾을 수 없습니다.'}</p>;
  }

  return (
    <AdminTemplateForm
      title={`Template Edit: ${template.name}`}
      description="템플릿 메타데이터를 수정하고 editor/renderer binding을 유지합니다."
      submitLabel="Save Changes"
      initialValue={{
        name: template.name,
        category: template.category,
        style: template.style,
        description: template.description,
        price: template.price,
        creatorShare: template.creatorShare,
        creatorId: template.creatorId || '',
        component: template.component,
        templateKey: template.templateKey,
      }}
      onSubmit={async (payload) => {
        await updateAdminTemplate(template.id, payload);
        router.push('/admin/templates');
      }}
    />
  );
}
