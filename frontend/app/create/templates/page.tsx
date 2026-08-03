import { Suspense } from 'react';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import VisualTemplateCatalog from '@/src/features/templates/ui/shared/VisualTemplateCatalog';

export default function CreateTemplatesPage() {
  return (
    <RequireAuth nextPath="/create/templates">
      <Suspense fallback={<div style={{ padding: 24 }}>…</div>}>
        <VisualTemplateCatalog />
      </Suspense>
    </RequireAuth>
  );
}
