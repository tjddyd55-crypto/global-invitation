'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
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
  /** start 의존성 변경으로 effect 가 재실행되어 pending 이 이미 지워진 뒤 concept 으로 튕기는 것을 막는다 */
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;

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

    startedRef.current = true;
    void start(pending.conceptType, sanitized).catch(() => {
      startedRef.current = false;
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
