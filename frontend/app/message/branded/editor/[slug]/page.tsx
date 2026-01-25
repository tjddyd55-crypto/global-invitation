'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../MessageBrandedEditorPage.module.css';
import MessageBrandedJCIEditor from '@/src/editors/messageBranded/jci/MessageBrandedJCIEditor';
import {
  getMessageBrandedJciDemoData,
  isMessageBrandedJciDemoSlug,
} from '@/src/templates/messageBranded/jci/data';
import type { BrandedMessageCard } from '@/src/models/messageBranded';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';

export default function MessageBrandedEditorPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const { language } = useI18n();
  const editorLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/message/branded/${slug}`);

  const [data, setData] = useState<BrandedMessageCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setError(null);

    if (isMessageBrandedJciDemoSlug(slug)) {
      setData(getMessageBrandedJciDemoData());
      return;
    }

    setError('지원하지 않는 branded 메시지 카드입니다.');
  }, [slug]);

  useEffect(() => {
    if (editorLoggedRef.current || !data) return;
    logEvent({ eventType: 'editor_open', templateType: 'branded', language, pageUrl });
    editorLoggedRef.current = true;
  }, [data, language, pageUrl]);

  if (!data) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.stateText}>{error || '로딩 중...'}</p>
      </div>
    );
  }

  return <MessageBrandedJCIEditor data={data} pageUrl={pageUrl} />;
}
