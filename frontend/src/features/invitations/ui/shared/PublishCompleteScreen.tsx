'use client';

import Link from 'next/link';
import GlobalSharePanel from '@/src/components/share/GlobalSharePanel';
import { useI18n } from '@/src/contexts/I18nContext';
import { interpolate } from '@/src/i18n';
import styles from './PublishCompleteScreen.module.css';

type PublishCompleteScreenProps = {
  invitationId: string;
  shareUrl: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

/**
 * 공개 완료 화면 (Figma Make: Publish Complete).
 * KakaoTalk payload는 persisted OG title/description/imageUrl을 그대로 전달한다.
 * Locale: My Invitations shell → service locale.
 */
export default function PublishCompleteScreen({
  invitationId,
  shareUrl,
  title,
  description,
  imageUrl,
}: PublishCompleteScreenProps) {
  const { t } = useI18n();
  const shareTitle = (title || '').trim() || t('publishComplete.fallbackTitle');
  const shareDescription = (description || '').trim() || t('publishComplete.fallbackDesc');

  return (
    <section className={styles.screen} data-testid="share-panel">
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('publishComplete.eyebrow')}</p>
        <h1>{t('publishComplete.title')}</h1>
        <p>{interpolate(t('publishComplete.desc'), { title: shareTitle })}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <p className={styles.shareUrlLine}>
            {t('publishComplete.shareUrl')}: <strong data-testid="share-url">{shareUrl}</strong>
          </p>
          <GlobalSharePanel
            shareUrl={shareUrl}
            title={shareTitle}
            text={shareDescription}
            imageUrl={imageUrl || undefined}
          />
        </div>
        <aside className={styles.sideColumn}>
          <Link href={shareUrl} className={styles.primaryLink} target="_blank" rel="noreferrer">
            {t('publishComplete.viewInvitation')}
          </Link>
          <Link href={`/my-invitations/${invitationId}/rsvp`} className={styles.secondaryLink}>
            {t('publishComplete.manageRsvp')}
          </Link>
          <Link href={`/my-invitations/${invitationId}/comments`} className={styles.secondaryLink}>
            {t('publishComplete.manageComments')}
          </Link>
          <Link href={`/editor/${invitationId}`} className={styles.secondaryLink}>
            {t('publishComplete.backToEditor')}
          </Link>
          <Link href="/my-invitations" className={styles.ghostLink}>
            {t('publishComplete.myInvitations')}
          </Link>
        </aside>
      </div>
    </section>
  );
}
