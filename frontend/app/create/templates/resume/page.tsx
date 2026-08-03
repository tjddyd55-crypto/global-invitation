'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { useCreateInvitation } from '@/src/features/templates/model/useCreateInvitation';
import {
  clearPendingVisualTemplate,
  readPendingVisualTemplate,
  VISUAL_TEMPLATE_RESUME_PATH,
} from '@/src/features/templates/model/pendingVisualTemplate';
import { isVisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { sanitizeVisualTemplateIdForSave } from '@/src/templates/visualTemplate/resolveVisualTemplateId';

export default function CreateTemplatesResumePage() {
  return (
    <RequireAuth nextPath={VISUAL_TEMPLATE_RESUME_PATH}>
      <ResumeInner />
    </RequireAuth>
  );
}

function ResumeInner() {
  const { start, error } = useCreateInvitation();
  const router = useRouter();
  const [message, setMessage] = useState('선택한 템플릿으로 초대장을 준비하는 중…');

  useEffect(() => {
    const pending = readPendingVisualTemplate();
    if (!pending || !isVisualTemplateId(pending.visualTemplateId)) {
      clearPendingVisualTemplate();
      router.replace('/create/concept');
      return;
    }
    const sanitized = sanitizeVisualTemplateIdForSave(
      pending.visualTemplateId,
      pending.conceptType
    );
    if (!sanitized) {
      clearPendingVisualTemplate();
      router.replace(`/create/templates?concept=${pending.conceptType}`);
      return;
    }
    void start(pending.conceptType, sanitized).catch(() => {
      setMessage('초대장 생성에 실패했습니다. 다시 시도해 주세요.');
    });
  }, [router, start]);

  return (
    <section style={{ padding: 48, textAlign: 'center' }} data-testid="template-resume">
      <p>{message}</p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
    </section>
  );
}
