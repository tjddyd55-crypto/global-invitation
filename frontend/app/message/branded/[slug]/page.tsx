'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../MessageBrandedPage.module.css';
import MessageBrandedJCI from '@/src/templates/messageBranded/jci/MessageBrandedJCI';
import {
  getMessageBrandedJciDemoData,
  isMessageBrandedJciDemoSlug,
} from '@/src/templates/messageBranded/jci/data';
import type { BrandedMessageCard } from '@/src/models/messageBranded';
import EditorBackButton from '@/app/_components/EditorBackButton';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { logEvent } from '@/src/lib/events';
import { buildShareUrl, getShareContent, shareLink } from '@/src/lib/share';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';

export default function MessageBrandedPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const { t, language } = useI18n();

  const [data, setData] = useState<BrandedMessageCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const viewLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/message/branded/${slug}`);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setError(null);
    setShared(false);
    setShareFallbackUrl(null);
    setIsSharing(false);

    if (isMessageBrandedJciDemoSlug(slug)) {
      setData(getMessageBrandedJciDemoData());
      return;
    }

    setError('지원하지 않는 branded 메시지 카드입니다.');
  }, [slug]);

  useEffect(() => {
    if (viewLoggedRef.current || !data) return;
    logEvent({ eventType: 'invitation_view', templateType: 'branded', language, pageUrl });
    viewLoggedRef.current = true;
  }, [data, language, pageUrl]);

  const handleShare = async () => {
    if (isSharing) return;
    setShareFallbackUrl(null);
    setIsSharing(true);
    try {
      logEvent({ eventType: 'share_click', templateType: 'branded', language, pageUrl });
      const { title, description } = getShareContent('branded', t);
      const url = buildShareUrl(`/message/branded/${slug}`);
      const result = await shareLink({ url, title, text: description });
      if (result === 'shared' || result === 'copied') {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      }
      if (result === 'manual') {
        setShareFallbackUrl(url);
        return;
      }
      if (result === 'failed') {
        alert(t(I18N_KEYS.notice.copyFailed));
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!data) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.stateText}>{error || '로딩 중...'}</p>
      </div>
    );
  }

  return (
    <>
      <EditorBackButton fallbackUrl={`/message/branded/editor/${slug}`} />
      <MessageBrandedJCI data={data} onShare={handleShare} isShared={shared} />
      {shareFallbackUrl && (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      )}
    </>
  );
}
