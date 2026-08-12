'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo } from 'react';
import Link from 'next/link';
import FullInvitationRenderer from '@/src/templates/full/FullInvitationRenderer';
import {
  getHomeInvitationPreviewData,
  HOME_PREVIEW_PATH,
  HOME_PREVIEW_TEMPLATE_ID,
} from '@/src/features/main/model/homeInvitationPreview';
import styles from './HomeInvitationPreviewPhone.module.css';

type HomeInvitationPreviewPhoneProps = {
  size?: 'desktop' | 'compact';
};

/**
 * Home hero phone — real Garden renderer, clipped and scaled.
 * Not a mock card. Interactions stay on the outer preview link.
 */
export default function HomeInvitationPreviewPhone({
  size = 'desktop',
}: HomeInvitationPreviewPhoneProps) {
  const data = useMemo(() => getHomeInvitationPreviewData(), []);

  return (
    <div className={styles.shell} data-size={size} data-testid="home-invitation-preview">
      <div className={styles.glow} aria-hidden />
      <div className={styles.phone}>
        <div className={styles.notch} aria-hidden />
        <div className={styles.clip}>
          <div className={styles.scale}>
            <FullInvitationRenderer
              data={data}
              previewMode
              renderMode="TEMPLATE_PREVIEW"
              visualTemplateIdOverride={HOME_PREVIEW_TEMPLATE_ID}
              showRsvp
              showGuestbook={false}
            />
          </div>
        </div>
        <Link href={HOME_PREVIEW_PATH} className={styles.hit} aria-label="결혼식 초대장 완성 예시 보기" />
      </div>
    </div>
  );
}
