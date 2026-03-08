'use client';
/* eslint-disable i18next/no-literal-string */

import { useRouter } from 'next/navigation';
import AdminTemplateForm from '@/src/components/admin/AdminTemplateForm';
import { createAdminTemplate } from '@/src/lib/adminApi';

export default function AdminTemplateCreatePage() {
  const router = useRouter();

  return (
    <AdminTemplateForm
      title="Template Create"
      description="새 템플릿 메타데이터를 등록하고 marketplace 구조에 편입합니다."
      submitLabel="Create Template"
      onSubmit={async (payload) => {
        await createAdminTemplate(payload);
        router.push('/admin/templates');
      }}
    />
  );
}
