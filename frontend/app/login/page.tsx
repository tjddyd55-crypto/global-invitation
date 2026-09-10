'use client';

import { Suspense } from 'react';
import RedirectIfAuthenticated from '@/src/features/auth/ui/shared/RedirectIfAuthenticated';
import { LoginScreen } from '@/src/features/auth/ui/shared/PasswordAuthScreens';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <RedirectIfAuthenticated>
        <LoginScreen />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
