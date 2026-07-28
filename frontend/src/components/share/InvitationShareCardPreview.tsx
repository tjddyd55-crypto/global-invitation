/**
 * 메신저/SNS 공통 링크 공유 카드 미리보기.
 * 앱 chrome·로고 복제 없음. 데이터는 openGraphSettings SSOT.
 */
'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { cdnImageSrc } from '@/src/lib/image';
import styles from './InvitationShareCardPreview.module.css';

export type InvitationShareCardPreviewProps = {
  title: string;
  description: string;
  imageUrl?: string;
  canonicalUrl: string;
  displayUrl?: string;
  hasPublicUrl?: boolean;
  loading?: boolean;
};

export default function InvitationShareCardPreview({
  title,
  description,
  imageUrl,
  canonicalUrl,
  displayUrl,
  hasPublicUrl = Boolean(canonicalUrl.trim()),
  loading,
}: InvitationShareCardPreviewProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const resolvedImage = !imageFailed && imageUrl ? cdnImageSrc(imageUrl) : '';
  const showImage = Boolean(resolvedImage);
  const urlLabel =
    (displayUrl || '').trim() || (hasPublicUrl ? canonicalUrl.replace(/^https?:\/\//i, '') : '');

  return (
    <section
      className={styles.panel}
      data-testid="invitation-share-card-preview"
      aria-label="공유 카드 미리보기"
    >
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.heading}>공유 카드 미리보기</h3>
          <p className={styles.help}>메신저와 SNS에서 초대장 링크를 공유할 때 표시되는 모습입니다.</p>
        </div>
        <span className={styles.badge}>실제 공유 데이터</span>
      </div>

      <article className={styles.card} data-testid="share-card-preview-body">
        <div className={styles.imageFrame} data-testid="share-card-preview-image">
          {loading ? (
            <div className={styles.placeholder}>불러오는 중…</div>
          ) : showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedImage}
              alt={title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.placeholder} data-testid="share-card-preview-image-placeholder">
              <span className={styles.placeholderIcon} aria-hidden>
                ▢
              </span>
              <span>공유 이미지를 선택해 주세요</span>
            </div>
          )}
        </div>

        <div className={styles.body}>
          <h4 className={styles.title} data-testid="share-card-preview-title">
            {title}
          </h4>
          <p className={styles.description} data-testid="share-card-preview-description">
            {description}
          </p>
          {hasPublicUrl && urlLabel ? (
            <a
              className={styles.url}
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={canonicalUrl}
              aria-label={`공개 초대장 링크 ${canonicalUrl}`}
              data-testid="share-card-preview-url"
            >
              {urlLabel}
            </a>
          ) : (
            <p className={`${styles.url} ${styles.urlMuted}`} data-testid="share-card-preview-url-pending">
              초대장 공개 후 링크가 표시됩니다.
            </p>
          )}
        </div>
      </article>

      <p className={styles.footnote}>실제 표시 형태는 메신저 앱에 따라 조금 다를 수 있습니다.</p>
    </section>
  );
}
