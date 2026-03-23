import { Suspense } from 'react';
import TemplatePreviewPage from './TemplatePreviewPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <TemplatePreviewPage />
    </Suspense>
  );
}
