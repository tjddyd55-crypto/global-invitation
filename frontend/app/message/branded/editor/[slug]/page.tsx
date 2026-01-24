'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../MessageBrandedEditorPage.module.css';
import MessageBrandedJCIEditor from '@/src/editors/messageBranded/jci/MessageBrandedJCIEditor';
import {
  getMessageBrandedJciDemoData,
  isMessageBrandedJciDemoSlug,
} from '@/src/templates/messageBranded/jci/data';
import type { BrandedMessageCard } from '@/src/models/messageBranded';

export default function MessageBrandedEditorPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

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

  if (!data) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.stateText}>{error || '로딩 중...'}</p>
      </div>
    );
  }

  return <MessageBrandedJCIEditor data={data} />;
}
