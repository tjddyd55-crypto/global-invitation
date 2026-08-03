'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import { getVisualTemplatePreviewFixture } from '@/src/templates/visualTemplate/previewFixtures';
import { getVisualTemplateDefinition } from '@/src/templates/visualTemplate/visualTemplateRegistry';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { useCreateInvitation } from '@/src/features/templates/model/useCreateInvitation';
import {
  savePendingVisualTemplate,
  VISUAL_TEMPLATE_RESUME_PATH,
} from '@/src/features/templates/model/pendingVisualTemplate';
import { fetchCurrentUser } from '@/src/shared/auth';
import styles from './VisualTemplatePreviewScreen.module.css';

type Props = {
  visualTemplateId: VisualTemplateId;
};

export default function VisualTemplatePreviewScreen({ visualTemplateId }: Props) {
  const def = getVisualTemplateDefinition(visualTemplateId);
  const fixture = getVisualTemplatePreviewFixture(visualTemplateId);
  const { start, creatingConcept } = useCreateInvitation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleCreate = useCallback(async () => {
    setBusy(true);
    try {
      const user = await fetchCurrentUser({ useCache: false });
      if (!user) {
        savePendingVisualTemplate({
          conceptType: def.conceptType,
          visualTemplateId: def.id,
          createdAt: Date.now(),
        });
        router.replace(`/auth/email?next=${encodeURIComponent(VISUAL_TEMPLATE_RESUME_PATH)}`);
        return;
      }
      await start(def.conceptType, def.id);
    } finally {
      setBusy(false);
    }
  }, [def, router, start]);

  const catalogHref = `/create/templates?concept=${def.conceptType}`;

  return (
    <div className={styles.page} data-testid="visual-template-preview">
      <header className={styles.bar}>
        <Link href={catalogHref} className={styles.back}>
          ← 뒤로
        </Link>
        <div className={styles.meta}>
          <strong>{def.name}</strong>
          <span>샘플 미리보기</span>
        </div>
        <button
          type="button"
          className={styles.cta}
          disabled={busy || Boolean(creatingConcept)}
          onClick={() => void handleCreate()}
          data-testid="preview-create-cta"
        >
          {busy ? '생성 중...' : '이 템플릿으로 만들기'}
        </button>
      </header>

      <div className={styles.frame}>
        <FullInvitationRenderer
          data={fixture}
          previewMode
          renderMode="TEMPLATE_PREVIEW"
          visualTemplateIdOverride={visualTemplateId}
          showRsvp
          showGuestbook={false}
        />
      </div>

      <div className={styles.bottomCta}>
        <button
          type="button"
          className={styles.ctaWide}
          disabled={busy || Boolean(creatingConcept)}
          onClick={() => void handleCreate()}
        >
          이 템플릿으로 초대장 만들기
        </button>
      </div>
    </div>
  );
}
