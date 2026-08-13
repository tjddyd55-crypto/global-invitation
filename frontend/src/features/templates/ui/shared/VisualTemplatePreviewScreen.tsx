'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
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
import { useI18n } from '@/src/contexts/I18nContext';
import { getMusicByKey } from '@/src/constants/music';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
import styles from './VisualTemplatePreviewScreen.module.css';

type Props = {
  visualTemplateId: VisualTemplateId;
};

export default function VisualTemplatePreviewScreen({ visualTemplateId }: Props) {
  const { locale, t } = useI18n();
  const def = getVisualTemplateDefinition(visualTemplateId);
  const fixture = useMemo(
    () => ({ ...getVisualTemplatePreviewFixture(visualTemplateId), locale }),
    [visualTemplateId, locale]
  );
  const { start, creatingConcept } = useCreateInvitation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const playableMusic = useMemo(
    () =>
      resolvePlayableInvitationMusic(fixture, (key) => {
        const track = getMusicByKey(key);
        return track ? { src: track.src, title: track.title } : undefined;
      }),
    [fixture]
  );

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
          {t('create.templates.back')}
        </Link>
        <div className={styles.meta}>
          <strong>{t(`template.${def.id}.name`) === `template.${def.id}.name` ? def.name : t(`template.${def.id}.name`)}</strong>
          <span>{t('create.templates.samplePreview')}</span>
        </div>
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

      {playableMusic ? <InvitationMusicPlayer music={playableMusic} /> : null}

      <div className={styles.bottomCta}>
        <button
          type="button"
          className={styles.ctaWide}
          disabled={busy || Boolean(creatingConcept)}
          onClick={() => void handleCreate()}
          data-testid="preview-create-cta"
        >
          {busy ? '생성 중...' : '이 템플릿으로 초대장 만들기'}
        </button>
      </div>
    </div>
  );
}
