'use client';

import { Suspense } from 'react';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import EmailStartScreen from '@/src/features/auth/ui/mobile/EmailStartScreen';
import DesktopEmailStartScreen from '@/src/features/auth/ui/pc/DesktopEmailStartScreen';

/**
 * Canonical Email Start — Figma `EmailStartScreen` / `DesktopEmailStartScreen`.
 * 인증번호 발송 성공 시 `/auth/verify` 로 이동한다 (auth 화면 분리, platformShell.ts 'auth').
 */
export default function AuthEmailPage() {
  return (
    <Suspense fallback={null}>
      <ResponsivePlatformBoundary mobile={<EmailStartScreen />} desktop={<DesktopEmailStartScreen />} />
    </Suspense>
  );
}
