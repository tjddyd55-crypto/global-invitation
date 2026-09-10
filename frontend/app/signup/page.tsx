'use client';

import { Suspense } from 'react';
import RedirectIfAuthenticated from '@/src/features/auth/ui/shared/RedirectIfAuthenticated';
import { SignupScreen } from '@/src/features/auth/ui/shared/PasswordAuthScreens';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <RedirectIfAuthenticated>
        <SignupScreen />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
