import { Suspense } from 'react';
import TemplatePreviewPage from './TemplatePreviewPage';

/** 번들·template 유효성 검사는 클라이언트 `TemplatePreviewPage`에서 fetch 직후 수행합니다. */

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <TemplatePreviewPage />
    </Suspense>
  );
}
