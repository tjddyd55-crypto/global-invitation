'use client';

import { Suspense } from 'react';
import AdminPaymentsPage from './PaymentsClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading payments…</div>}>
      <AdminPaymentsPage />
    </Suspense>
  );
}
