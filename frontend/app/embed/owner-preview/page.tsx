'use client';

import { Suspense } from 'react';
import { OwnerPreviewEmbedContent } from './OwnerPreviewEmbedContent';

export default function OwnerPreviewEmbedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>불러오는 중...</p>
        </div>
      }
    >
      <OwnerPreviewEmbedContent />
    </Suspense>
  );
}
