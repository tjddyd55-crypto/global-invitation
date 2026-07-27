'use client';

import { Suspense } from 'react';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import RedirectIfAuthenticated from '@/src/features/auth/ui/shared/RedirectIfAuthenticated';
import EmailStartScreen from '@/src/features/auth/ui/mobile/EmailStartScreen';
import DesktopEmailStartScreen from '@/src/features/auth/ui/pc/DesktopEmailStartScreen';

/**
 * Canonical Email Start — Figma `EmailStartScreen` / `DesktopEmailStartScreen`.
 * 이미 인증된 사용자는 next 로 redirect 한다.
 */
export default function AuthEmailPage() {
  return (
    <Suspense fallback={null}>
      <RedirectIfAuthenticated>
        <ResponsivePlatformBoundary mobile={<EmailStartScreen />} desktop={<DesktopEmailStartScreen />} />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
